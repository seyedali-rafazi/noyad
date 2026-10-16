/**
 * Core Domain Primitive Types and Enumerations
 */

export type TaskId = string;
export type NoteId = string;
export type ConversationId = string;
export type MessageId = string;

/**
 * ISO 8601 UTC timestamp string (e.g. "2026-10-15T12:00:00.000Z")
 * In accordance with our persistence rules, localized Jalali strings
 * must NEVER be stored in domain models or database records.
 */
export type IsoDateTimeString = string;

/**
 * Task Priority levels.
 * Explicit union replacing unrestricted strings.
 */
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Task lifecycle statuses.
 * Explicit union replacing unrestricted strings.
 */
export const TASK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

/**
 * Chat message sender roles.
 */
export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

/**
 * Origin of an application operation or data mutation.
 */
export const OPERATION_SOURCES = ['user', 'ai', 'system'] as const;
export type OperationSource = (typeof OPERATION_SOURCES)[number];
