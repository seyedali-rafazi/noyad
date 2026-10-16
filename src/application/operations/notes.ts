/**
 * Note Operation Contracts
 *
 * Defines explicit input, output, and validation contracts for:
 * - create_note
 * - update_note
 * - delete_note
 *
 * Boundary rules:
 * - Target record identification is mandatory for update and delete.
 * - Missing or invalid identifiers return structured validation errors.
 * - Destructive operations (delete_note) support confirmation policies.
 * - No direct database or CRUD execution is implemented in this phase.
 */

import { Note } from '../../domain/models/note';
import { NoteId, OperationSource } from '../../domain/types/common';
import { OperationResult } from './types';
import {
  FieldValidationError,
  createValidationError,
  ValidationError,
} from '../../domain/errors';
import { validateEntityIdentifier } from '../../domain/rules/identifier';
import {
  validateNoteTitle,
  validateNoteContent,
  normalizeNoteTags,
} from '../../domain/rules/note';

/* -------------------------------------------------------------------------- */
/*                              1. CREATE_NOTE                                */
/* -------------------------------------------------------------------------- */

export interface CreateNoteInput {
  readonly title: string;
  readonly content: string;
  readonly tags?: readonly string[];
  readonly isPinned?: boolean;
  readonly source?: OperationSource;
}

export type CreateNoteResult = OperationResult<Note>;

export function validateCreateNoteInput(
  input: unknown
): { isValid: true; value: CreateNoteInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError([
        { field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' },
      ]),
    };
  }

  const raw = input as Partial<CreateNoteInput>;
  const errors: FieldValidationError[] = [];

  const titleResult = validateNoteTitle(raw.title);
  if (!titleResult.isValid) {
    errors.push(...titleResult.error.details.fields);
  }

  const contentResult = validateNoteContent(raw.content ?? '');
  if (!contentResult.isValid) {
    errors.push(...contentResult.error.details.fields);
  }

  let validatedTags: readonly string[] = [];
  if (raw.tags !== undefined) {
    const tagsResult = normalizeNoteTags(raw.tags);
    if (!tagsResult.isValid) {
      errors.push(...tagsResult.error.details.fields);
    } else {
      validatedTags = tagsResult.value;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: createValidationError(errors) };
  }

  return {
    isValid: true,
    value: {
      title: titleResult.isValid ? titleResult.value : (raw.title as string).trim(),
      content: raw.content as string,
      tags: validatedTags,
      isPinned: raw.isPinned ?? false,
      source: raw.source ?? 'user',
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              2. UPDATE_NOTE                                */
/* -------------------------------------------------------------------------- */

export interface UpdateNoteInput {
  /**
   * Unique identifier of the target note. Mandatory.
   */
  readonly id: NoteId;
  readonly title?: string;
  readonly content?: string;
  readonly tags?: readonly string[];
  readonly isPinned?: boolean;
  readonly source?: OperationSource;
  readonly confirmed?: boolean;
}

export type UpdateNoteResult = OperationResult<Note>;

export function validateUpdateNoteInput(
  input: unknown
): { isValid: true; value: UpdateNoteInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError([
        { field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' },
      ]),
    };
  }

  const raw = input as Partial<UpdateNoteInput>;
  const errors: FieldValidationError[] = [];

  const idResult = validateEntityIdentifier(raw.id, 'id');
  if (!idResult.isValid) {
    errors.push(...idResult.error.details.fields);
  }

  let validatedTitle: string | undefined = undefined;
  if (raw.title !== undefined) {
    const titleResult = validateNoteTitle(raw.title);
    if (!titleResult.isValid) {
      errors.push(...titleResult.error.details.fields);
    } else {
      validatedTitle = titleResult.value;
    }
  }

  let validatedContent: string | undefined = undefined;
  if (raw.content !== undefined) {
    const contentResult = validateNoteContent(raw.content);
    if (!contentResult.isValid) {
      errors.push(...contentResult.error.details.fields);
    } else {
      validatedContent = contentResult.value;
    }
  }

  let validatedTags: readonly string[] | undefined = undefined;
  if (raw.tags !== undefined) {
    const tagsResult = normalizeNoteTags(raw.tags);
    if (!tagsResult.isValid) {
      errors.push(...tagsResult.error.details.fields);
    } else {
      validatedTags = tagsResult.value;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: createValidationError(errors) };
  }

  return {
    isValid: true,
    value: {
      id: idResult.isValid ? idResult.value : (raw.id as string),
      title: validatedTitle,
      content: validatedContent,
      tags: validatedTags,
      isPinned: raw.isPinned,
      source: raw.source ?? 'user',
      confirmed: raw.confirmed ?? false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              3. DELETE_NOTE                                */
/* -------------------------------------------------------------------------- */

export interface DeleteNoteInput {
  /**
   * Unique identifier of the target note. Mandatory.
   */
  readonly id: NoteId;
  /**
   * Confirmation flag from UI dialog
   */
  readonly confirmed?: boolean;
  readonly source?: OperationSource;
}

export interface DeleteNoteSuccessPayload {
  readonly id: NoteId;
  readonly deleted: true;
}

export type DeleteNoteResult = OperationResult<DeleteNoteSuccessPayload>;

export function validateDeleteNoteInput(
  input: unknown
): { isValid: true; value: DeleteNoteInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError([
        { field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' },
      ]),
    };
  }

  const raw = input as Partial<DeleteNoteInput>;
  const idResult = validateEntityIdentifier(raw.id, 'id');
  if (!idResult.isValid) {
    return { isValid: false, error: idResult.error };
  }

  return {
    isValid: true,
    value: {
      id: idResult.value,
      confirmed: raw.confirmed ?? false,
      source: raw.source ?? 'user',
    },
  };
}
