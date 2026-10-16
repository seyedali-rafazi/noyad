/**
 * Task Domain Business Rules and Invariants
 */

import {
  TaskPriority,
  TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
  IsoDateTimeString,
} from '../types/common';
import {
  createValidationError,
  createConflictError,
  ValidationError,
  ConflictError,
} from '../errors';

export const TASK_RULES = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 255,
  DESCRIPTION_MAX_LENGTH: 4000,
} as const;

/**
 * Validates a task title according to domain boundaries.
 */
export function validateTaskTitle(
  title: unknown
): { isValid: true; value: string } | { isValid: false; error: ValidationError } {
  if (typeof title !== 'string') {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: 'Task title must be a string',
          code: 'TYPE_MISMATCH',
          received: title,
        },
      ]),
    };
  }

  const trimmed = title.trim();
  if (trimmed.length < TASK_RULES.TITLE_MIN_LENGTH) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: 'Task title cannot be empty',
          code: 'TITLE_EMPTY',
          received: title,
        },
      ]),
    };
  }

  if (trimmed.length > TASK_RULES.TITLE_MAX_LENGTH) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: `Task title exceeds maximum allowed length of ${TASK_RULES.TITLE_MAX_LENGTH} characters`,
          code: 'TITLE_TOO_LONG',
          received: title,
        },
      ]),
    };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validates that an ISO date string is a valid UTC representation.
 * Enforces the rule that localized Jalali strings must NEVER be stored as timestamps.
 */
export function validateIsoDateTime(
  value: unknown,
  fieldName = 'dueDate'
): { isValid: true; value: IsoDateTimeString | null } | { isValid: false; error: ValidationError } {
  if (value === null || value === undefined) {
    return { isValid: true, value: null };
  }

  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: fieldName,
          message: `${fieldName} must be a valid ISO 8601 string or null`,
          code: 'TYPE_MISMATCH',
          received: value,
        },
      ]),
    };
  }

  // Reject Persian/Arabic numeral strings or slash-based Jalali formats (e.g. "۱۴۰۴/۰۱/۰۱")
  const containsPersianNumerals = /[\u06F0-\u06F9\u0660-\u0669]/.test(value);
  if (containsPersianNumerals) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: fieldName,
          message: `Localized Jalali or Persian numerals are not permitted in storage timestamps. Store as UTC ISO 8601 string.`,
          code: 'INVALID_TIMESTAMP_FORMAT',
          received: value,
        },
      ]),
    };
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: fieldName,
          message: `${fieldName} is not a valid parseable ISO 8601 timestamp`,
          code: 'INVALID_TIMESTAMP',
          received: value,
        },
      ]),
    };
  }

  return { isValid: true, value: new Date(timestamp).toISOString() };
}

/**
 * Validates task priority against allowed explicit union.
 */
export function validateTaskPriority(
  priority: unknown
): { isValid: true; value: TaskPriority } | { isValid: false; error: ValidationError } {
  if (typeof priority !== 'string' || !TASK_PRIORITIES.includes(priority as TaskPriority)) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'priority',
          message: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`,
          code: 'INVALID_PRIORITY',
          received: priority,
        },
      ]),
    };
  }

  return { isValid: true, value: priority as TaskPriority };
}

/**
 * Validates task status against allowed explicit union.
 */
export function validateTaskStatus(
  status: unknown
): { isValid: true; value: TaskStatus } | { isValid: false; error: ValidationError } {
  if (typeof status !== 'string' || !TASK_STATUSES.includes(status as TaskStatus)) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'status',
          message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
          received: status,
        },
      ]),
    };
  }

  return { isValid: true, value: status as TaskStatus };
}

/**
 * Validates task lifecycle state transitions.
 * Prevents invalid state jumps and produces typed ConflictError on violation.
 */
export function validateTaskStatusTransition(
  currentStatus: TaskStatus,
  targetStatus: TaskStatus
): { isAllowed: true } | { isAllowed: false; error: ConflictError } {
  if (currentStatus === targetStatus) {
    return { isAllowed: true };
  }

  // Define allowed transitions
  const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
    pending: ['in_progress', 'completed', 'cancelled'],
    in_progress: ['pending', 'completed', 'cancelled'],
    completed: ['pending', 'in_progress'], // Reopening
    cancelled: ['pending'], // Reactivating
  };

  const allowed = ALLOWED_TRANSITIONS[currentStatus].includes(targetStatus);
  if (!allowed) {
    return {
      isAllowed: false,
      error: createConflictError(
        'task',
        `Cannot transition task status from "${currentStatus}" to "${targetStatus}"`,
        { conflictingField: 'status', existingValue: currentStatus }
      ),
    };
  }

  return { isAllowed: true };
}

/**
 * Invariant helper: computes the exact completion state for a task.
 * Enforces that completing a task records a timestamp (completedAt),
 * and reopening/uncompleting a task clears completedAt to null.
 */
export function resolveTaskCompletionState(
  targetStatus: TaskStatus,
  explicitCompletedAt?: string | null
): { status: TaskStatus; completedAt: IsoDateTimeString | null } {
  if (targetStatus === 'completed') {
    const timestamp = explicitCompletedAt ?? new Date().toISOString();
    return {
      status: 'completed',
      completedAt: timestamp,
    };
  }

  return {
    status: targetStatus,
    completedAt: null,
  };
}
