/**
 * AI Operation Payloads and Validation Contracts
 *
 * Boundary rules:
 * - AI-generated payloads are treated as UNTRUSTED input.
 * - LLM outputs might contain hallucinations, invalid dates, injection text, or
 *   invalid enum values.
 * - Payloads MUST be validated, sanitized, and transformed before being accepted
 *   as application inputs.
 * - Ambiguous user requests that match multiple records trigger an AmbiguousRequestError
 *   rather than making arbitrary destructive guesses.
 */

import { TaskPriority, TASK_PRIORITIES } from '../../domain/types/common';
import {
  AiValidationFailureError,
  createAiValidationFailureError,
  AmbiguousRequestError,
  createAmbiguousRequestError,
  AmbiguousRequestCandidate,
  FieldValidationError,
} from '../../domain/errors';
import { validateIsoDateTime, TASK_RULES } from '../../domain/rules/task';
import { CreateTaskInput } from '../operations/tasks';
import { CreateNoteInput } from '../operations/notes';

export const AI_INTENTS = [
  'create_task',
  'update_task',
  'complete_task',
  'delete_task',
  'create_note',
  'update_note',
  'delete_note',
  'list_tasks',
  'query_schedule',
  'unknown',
] as const;

export type AiIntent = (typeof AI_INTENTS)[number];

export interface UntrustedAiTaskPayload {
  readonly title?: unknown;
  readonly description?: unknown;
  readonly dueDate?: unknown;
  readonly isAllDay?: unknown;
  readonly priority?: unknown;
  readonly timezone?: unknown;
  readonly confidence?: unknown;
  readonly rawPrompt?: unknown;
}

export interface UntrustedAiNotePayload {
  readonly title?: unknown;
  readonly content?: unknown;
  readonly tags?: unknown;
  readonly isPinned?: unknown;
  readonly confidence?: unknown;
  readonly rawPrompt?: unknown;
}

export interface UntrustedAiOperationCandidate {
  readonly intent: AiIntent;
  readonly confidence: number;
  readonly payload: unknown;
  readonly originalUserUtterance: string;
}

/**
 * Validates and sanitizes an untrusted AI-generated task payload into a strongly-typed CreateTaskInput.
 * Strips prompt wrappers, validates ISO timestamp, and ensures priority safety.
 */
export function sanitizeAndValidateAiTaskPayload(
  raw: unknown
):
  | { isValid: true; data: CreateTaskInput }
  | { isValid: false; error: AiValidationFailureError } {
  if (typeof raw !== 'object' || raw === null) {
    return {
      isValid: false,
      error: createAiValidationFailureError(
        'AI payload must be a non-null object',
        { rawInput: raw }
      ),
    };
  }

  const payload = raw as UntrustedAiTaskPayload;
  const issues: FieldValidationError[] = [];

  // 1. Sanitize & Validate Title
  if (typeof payload.title !== 'string') {
    issues.push({
      field: 'title',
      message: 'AI payload missing required string title',
      code: 'MISSING_TITLE',
      received: payload.title,
    });
  }

  let sanitizedTitle = '';
  if (typeof payload.title === 'string') {
    // Strip common AI prompt wrappers (e.g., quotes, "تسک: ", "Task: ")
    sanitizedTitle = payload.title
      .trim()
      .replace(/^(تسک\s*:\s*|task\s*:\s*|عنوان\s*:\s*)/i, '')
      .trim()
      .replace(/^["'«]/, '')
      .replace(/["'»]$/, '')
      .trim();

    if (sanitizedTitle.length < TASK_RULES.TITLE_MIN_LENGTH) {
      issues.push({
        field: 'title',
        message: 'AI-generated task title cannot be empty after sanitization',
        code: 'TITLE_EMPTY',
        received: payload.title,
      });
    } else if (sanitizedTitle.length > TASK_RULES.TITLE_MAX_LENGTH) {
      issues.push({
        field: 'title',
        message: `AI-generated task title exceeds ${TASK_RULES.TITLE_MAX_LENGTH} characters`,
        code: 'TITLE_TOO_LONG',
        received: payload.title,
      });
    }
  }

  // 2. Validate DueDate (ISO 8601 UTC)
  let validatedDueDate: string | null = null;
  if (payload.dueDate !== undefined && payload.dueDate !== null) {
    const dateResult = validateIsoDateTime(payload.dueDate, 'dueDate');
    if (!dateResult.isValid) {
      issues.push(...dateResult.error.details.fields);
    } else {
      validatedDueDate = dateResult.value;
    }
  }

  // 3. Validate Priority
  let validatedPriority: TaskPriority = 'medium';
  if (payload.priority !== undefined && payload.priority !== null) {
    if (
      typeof payload.priority === 'string' &&
      TASK_PRIORITIES.includes(payload.priority.toLowerCase() as TaskPriority)
    ) {
      validatedPriority = payload.priority.toLowerCase() as TaskPriority;
    } else {
      issues.push({
        field: 'priority',
        message: `Invalid priority "${String(payload.priority)}". Must be one of: ${TASK_PRIORITIES.join(', ')}`,
        code: 'INVALID_PRIORITY',
        received: payload.priority,
      });
    }
  }

  // 4. Validate Description
  let sanitizedDescription: string | null = null;
  if (typeof payload.description === 'string') {
    sanitizedDescription = payload.description.trim() || null;
  } else if (payload.description !== undefined && payload.description !== null) {
    issues.push({
      field: 'description',
      message: 'Description must be a string or null',
      code: 'TYPE_MISMATCH',
      received: payload.description,
    });
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      error: createAiValidationFailureError('Untrusted AI task payload failed validation', {
        rawInput: raw,
        validationIssues: issues,
      }),
    };
  }

  const data: CreateTaskInput = {
    title: sanitizedTitle,
    description: sanitizedDescription,
    dueDate: validatedDueDate,
    isAllDay: typeof payload.isAllDay === 'boolean' ? payload.isAllDay : false,
    priority: validatedPriority,
    source: 'ai',
  };

  return { isValid: true, data };
}

/**
 * Validates and sanitizes an untrusted AI-generated note payload.
 */
export function sanitizeAndValidateAiNotePayload(
  raw: unknown
):
  | { isValid: true; data: CreateNoteInput }
  | { isValid: false; error: AiValidationFailureError } {
  if (typeof raw !== 'object' || raw === null) {
    return {
      isValid: false,
      error: createAiValidationFailureError(
        'AI payload must be a non-null object',
        { rawInput: raw }
      ),
    };
  }

  const payload = raw as UntrustedAiNotePayload;
  const issues: FieldValidationError[] = [];

  if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
    issues.push({
      field: 'title',
      message: 'AI note payload requires non-empty title string',
      code: 'MISSING_TITLE',
      received: payload.title,
    });
  }

  if (typeof payload.content !== 'string') {
    issues.push({
      field: 'content',
      message: 'AI note payload requires content string',
      code: 'MISSING_CONTENT',
      received: payload.content,
    });
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      error: createAiValidationFailureError('Untrusted AI note payload failed validation', {
        rawInput: raw,
        validationIssues: issues,
      }),
    };
  }

  const rawTags = Array.isArray(payload.tags)
    ? (payload.tags.filter((t) => typeof t === 'string') as string[])
    : undefined;

  return {
    isValid: true,
    data: {
      title: (payload.title as string).trim(),
      content: payload.content as string,
      tags: rawTags,
      isPinned: typeof payload.isPinned === 'boolean' ? payload.isPinned : false,
      source: 'ai',
    },
  };
}

/**
 * Resolves an ambiguous user query into a structured AmbiguousRequestError.
 */
export function createAmbiguousMatchResolution(
  userQuery: string,
  matches: readonly AmbiguousRequestCandidate[]
): AmbiguousRequestError {
  const titles = matches.map((m) => `«${m.title}»`).join(' و ');
  const clarificationPrompt = `درخواست شما با چند مورد تطابق دارد (${titles}). لطفاً مشخص کنید کدام مورد مد نظر شماست.`;

  return createAmbiguousRequestError(userQuery, matches, clarificationPrompt);
}
