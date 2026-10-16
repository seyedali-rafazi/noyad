/**
 * Entity Identifier Validation Rules
 */

import { FieldValidationError, createValidationError, ValidationError } from '../errors';

/**
 * Validates that an entity identifier is non-empty, trimmed, and a valid string.
 */
export function validateEntityIdentifier(
  id: unknown,
  fieldName = 'id'
): { isValid: true; value: string } | { isValid: false; error: ValidationError } {
  if (typeof id !== 'string' || id.trim().length === 0) {
    const fieldError: FieldValidationError = {
      field: fieldName,
      message: `Identifier for "${fieldName}" must be a non-empty string`,
      code: 'INVALID_IDENTIFIER',
      received: id,
    };
    return {
      isValid: false,
      error: createValidationError([fieldError], `Missing or invalid ${fieldName} identifier`),
    };
  }

  return { isValid: true, value: id.trim() };
}
