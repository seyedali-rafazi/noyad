/**
 * Global and Shared TypeScript Type Definitions
 */

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T, E = Error> = Promise<
  { data: T; error: null } | { data: null; error: E }
>;

// Convenient aliases to core domain and application types
export type {
  TaskId,
  NoteId,
  ConversationId,
  MessageId,
  TaskPriority,
  TaskStatus,
  MessageRole,
  OperationSource,
  IsoDateTimeString,
} from '../domain/types/common';

export type { ApplicationError, ErrorCode } from '../domain/errors';
export type { OperationResult } from '../application/operations/types';
