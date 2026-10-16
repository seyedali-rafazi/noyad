/**
 * Note Domain Business Rules and Invariants
 */

import {
  createValidationError,
  ValidationError,
  FieldValidationError,
} from '../errors';

export const NOTE_RULES = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 255,
  CONTENT_MAX_LENGTH: 50000,
  MAX_TAGS_COUNT: 20,
  TAG_MAX_LENGTH: 50,
} as const;

/**
 * Validates a note title.
 */
export function validateNoteTitle(
  title: unknown
): { isValid: true; value: string } | { isValid: false; error: ValidationError } {
  if (typeof title !== 'string') {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: 'Note title must be a string',
          code: 'TYPE_MISMATCH',
          received: title,
        },
      ]),
    };
  }

  const trimmed = title.trim();
  if (trimmed.length < NOTE_RULES.TITLE_MIN_LENGTH) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: 'Note title cannot be empty',
          code: 'TITLE_EMPTY',
          received: title,
        },
      ]),
    };
  }

  if (trimmed.length > NOTE_RULES.TITLE_MAX_LENGTH) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'title',
          message: `Note title exceeds maximum allowed length of ${NOTE_RULES.TITLE_MAX_LENGTH} characters`,
          code: 'TITLE_TOO_LONG',
          received: title,
        },
      ]),
    };
  }

  return { isValid: true, value: trimmed };
}

/**
 * Validates note content length.
 */
export function validateNoteContent(
  content: unknown
): { isValid: true; value: string } | { isValid: false; error: ValidationError } {
  if (typeof content !== 'string') {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'content',
          message: 'Note content must be a string',
          code: 'TYPE_MISMATCH',
          received: content,
        },
      ]),
    };
  }

  if (content.length > NOTE_RULES.CONTENT_MAX_LENGTH) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'content',
          message: `Note content exceeds maximum length of ${NOTE_RULES.CONTENT_MAX_LENGTH} characters`,
          code: 'CONTENT_TOO_LONG',
        },
      ]),
    };
  }

  return { isValid: true, value: content };
}

/**
 * Normalizes an array of note tags:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips empty strings
 * - Deduplicates
 * - Validates max tags count and individual tag length
 */
export function normalizeNoteTags(
  rawTags: unknown
): { isValid: true; value: readonly string[] } | { isValid: false; error: ValidationError } {
  if (rawTags === null || rawTags === undefined) {
    return { isValid: true, value: Object.freeze([]) };
  }

  if (!Array.isArray(rawTags)) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'tags',
          message: 'Tags must be an array of strings',
          code: 'TYPE_MISMATCH',
          received: rawTags,
        },
      ]),
    };
  }

  const errors: FieldValidationError[] = [];
  const normalizedSet = new Set<string>();

  for (let i = 0; i < rawTags.length; i++) {
    const item = rawTags[i];
    if (typeof item !== 'string') {
      errors.push({
        field: `tags[${i}]`,
        message: 'Tag item must be a string',
        code: 'TYPE_MISMATCH',
        received: item,
      });
      continue;
    }

    const trimmed = item.trim().toLowerCase();
    if (trimmed.length === 0) {
      continue;
    }

    if (trimmed.length > NOTE_RULES.TAG_MAX_LENGTH) {
      errors.push({
        field: `tags[${i}]`,
        message: `Tag "${trimmed.slice(0, 10)}..." exceeds max length of ${NOTE_RULES.TAG_MAX_LENGTH} characters`,
        code: 'TAG_TOO_LONG',
        received: item,
      });
      continue;
    }

    normalizedSet.add(trimmed);
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: createValidationError(errors, 'Invalid tags specified for note'),
    };
  }

  const tags = Array.from(normalizedSet);
  if (tags.length > NOTE_RULES.MAX_TAGS_COUNT) {
    return {
      isValid: false,
      error: createValidationError([
        {
          field: 'tags',
          message: `Note exceeds maximum permitted tags limit of ${NOTE_RULES.MAX_TAGS_COUNT}`,
          code: 'TOO_MANY_TAGS',
          received: tags.length,
        },
      ]),
    };
  }

  return { isValid: true, value: Object.freeze(tags) };
}
