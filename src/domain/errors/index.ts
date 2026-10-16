/**
 * Application & Domain Error Contracts
 *
 * A small, consistent, typed error model covering the 6 core failure modes:
 * - Validation errors (invalid input fields, format violations)
 * - Missing records (entity not found by ID)
 * - Conflicting changes (optimistic concurrency, duplicate, invalid status transition)
 * - Database failures (SQLite I/O failure, disk full, constraint violation)
 * - AI response validation failures (malformed LLM output, hallucinated attributes)
 * - Ambiguous user requests (natural language queries matching multiple targets)
 */

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AI_VALIDATION_FAILURE: 'AI_VALIDATION_FAILURE',
  AMBIGUOUS_REQUEST: 'AMBIGUOUS_REQUEST',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface FieldValidationError {
  readonly field: string;
  readonly message: string;
  readonly code?: string;
  readonly received?: unknown;
}

export interface ValidationErrorDetails {
  readonly fields: readonly FieldValidationError[];
}

export interface NotFoundErrorDetails {
  readonly entityType: 'task' | 'note' | 'conversation' | 'message';
  readonly entityId: string;
}

export interface ConflictErrorDetails {
  readonly entityType: 'task' | 'note' | 'conversation' | 'message';
  readonly reason: string;
  readonly conflictingField?: string;
  readonly existingValue?: unknown;
}

export interface DatabaseErrorDetails {
  readonly cause?: string;
  readonly queryHint?: string;
  readonly isTransient?: boolean;
}

export interface AiValidationFailureDetails {
  readonly failureReason: string;
  readonly rawInput?: unknown;
  readonly validationIssues?: readonly FieldValidationError[];
}

export interface AmbiguousRequestCandidate {
  readonly id: string;
  readonly title: string;
  readonly entityType: 'task' | 'note';
}

export interface AmbiguousRequestDetails {
  readonly query: string;
  readonly candidateMatches: readonly AmbiguousRequestCandidate[];
  readonly clarificationPrompt: string;
}

export interface BaseApplicationError<C extends ErrorCode, D> {
  readonly code: C;
  readonly message: string;
  readonly details: D;
}

export type ValidationError = BaseApplicationError<
  typeof ERROR_CODES.VALIDATION_ERROR,
  ValidationErrorDetails
>;

export type NotFoundError = BaseApplicationError<
  typeof ERROR_CODES.NOT_FOUND,
  NotFoundErrorDetails
>;

export type ConflictError = BaseApplicationError<
  typeof ERROR_CODES.CONFLICT,
  ConflictErrorDetails
>;

export type DatabaseError = BaseApplicationError<
  typeof ERROR_CODES.DATABASE_ERROR,
  DatabaseErrorDetails
>;

export type AiValidationFailureError = BaseApplicationError<
  typeof ERROR_CODES.AI_VALIDATION_FAILURE,
  AiValidationFailureDetails
>;

export type AmbiguousRequestError = BaseApplicationError<
  typeof ERROR_CODES.AMBIGUOUS_REQUEST,
  AmbiguousRequestDetails
>;

export type ApplicationError =
  | ValidationError
  | NotFoundError
  | ConflictError
  | DatabaseError
  | AiValidationFailureError
  | AmbiguousRequestError;

/* -------------------------------------------------------------------------- */
/*                               Factory Methods                              */
/* -------------------------------------------------------------------------- */

export function createValidationError(
  fields: readonly FieldValidationError[],
  message = 'Validation failed for the requested operation'
): ValidationError {
  return {
    code: ERROR_CODES.VALIDATION_ERROR,
    message,
    details: { fields: Object.freeze([...fields]) },
  };
}

export function createNotFoundError(
  entityType: NotFoundErrorDetails['entityType'],
  entityId: string,
  message = `${entityType} with identifier "${entityId}" was not found`
): NotFoundError {
  return {
    code: ERROR_CODES.NOT_FOUND,
    message,
    details: { entityType, entityId },
  };
}

export function createConflictError(
  entityType: ConflictErrorDetails['entityType'],
  reason: string,
  extra?: { conflictingField?: string; existingValue?: unknown },
  message = `Conflict detected for ${entityType}: ${reason}`
): ConflictError {
  return {
    code: ERROR_CODES.CONFLICT,
    message,
    details: {
      entityType,
      reason,
      conflictingField: extra?.conflictingField,
      existingValue: extra?.existingValue,
    },
  };
}

export function createDatabaseError(
  cause: unknown,
  message = 'A database operation failure occurred',
  options?: { queryHint?: string; isTransient?: boolean }
): DatabaseError {
  const causeString =
    cause instanceof Error
      ? cause.message
      : typeof cause === 'string'
        ? cause
        : 'Unknown database error';

  return {
    code: ERROR_CODES.DATABASE_ERROR,
    message,
    details: {
      cause: causeString,
      queryHint: options?.queryHint,
      isTransient: options?.isTransient ?? false,
    },
  };
}

export function createAiValidationFailureError(
  failureReason: string,
  options?: {
    rawInput?: unknown;
    validationIssues?: readonly FieldValidationError[];
  },
  message = `AI output validation failed: ${failureReason}`
): AiValidationFailureError {
  return {
    code: ERROR_CODES.AI_VALIDATION_FAILURE,
    message,
    details: {
      failureReason,
      rawInput: options?.rawInput,
      validationIssues: options?.validationIssues
        ? Object.freeze([...options.validationIssues])
        : undefined,
    },
  };
}

export function createAmbiguousRequestError(
  query: string,
  candidateMatches: readonly AmbiguousRequestCandidate[],
  clarificationPrompt: string,
  message = `The request "${query}" matches multiple candidate records and requires user clarification`
): AmbiguousRequestError {
  return {
    code: ERROR_CODES.AMBIGUOUS_REQUEST,
    message,
    details: {
      query,
      candidateMatches: Object.freeze([...candidateMatches]),
      clarificationPrompt,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                 Type Guards                                */
/* -------------------------------------------------------------------------- */

export function isApplicationError(error: unknown): error is ApplicationError {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as Partial<ApplicationError>;
  return (
    typeof candidate.code === 'string' &&
    Object.values(ERROR_CODES).includes(candidate.code as ErrorCode) &&
    typeof candidate.message === 'string' &&
    typeof candidate.details === 'object' &&
    candidate.details !== null
  );
}

export function isValidationError(
  error: ApplicationError
): error is ValidationError {
  return error.code === ERROR_CODES.VALIDATION_ERROR;
}

export function isNotFoundError(
  error: ApplicationError
): error is NotFoundError {
  return error.code === ERROR_CODES.NOT_FOUND;
}

export function isConflictError(
  error: ApplicationError
): error is ConflictError {
  return error.code === ERROR_CODES.CONFLICT;
}

export function isDatabaseError(
  error: ApplicationError
): error is DatabaseError {
  return error.code === ERROR_CODES.DATABASE_ERROR;
}

export function isAiValidationFailureError(
  error: ApplicationError
): error is AiValidationFailureError {
  return error.code === ERROR_CODES.AI_VALIDATION_FAILURE;
}

export function isAmbiguousRequestError(
  error: ApplicationError
): error is AmbiguousRequestError {
  return error.code === ERROR_CODES.AMBIGUOUS_REQUEST;
}
