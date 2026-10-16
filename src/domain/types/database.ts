/**
 * Database Record Contracts (Persistence Boundary)
 *
 * These contracts represent the raw tabular data stored in SQLite via Drizzle ORM.
 *
 * Architectural Boundary:
 * - Domain models are domain-rich with camelCase fields, native JS booleans, and arrays.
 * - Database records reflect SQLite physical storage: integers for booleans (0 | 1),
 *   JSON strings for arrays/objects, and snake_case column names.
 * - Domain logic must NEVER directly consume database records. An adapter/repository
 *   maps between Domain Models and Database Records.
 */

import { TaskPriority, TaskStatus, MessageRole } from './common';

export interface TaskRecord {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly due_date: string | null; // ISO 8601 UTC string
  readonly is_all_day: number; // 0 | 1 in SQLite
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly completed_at: string | null; // ISO 8601 UTC string
  readonly created_at: string; // ISO 8601 UTC string
  readonly updated_at: string; // ISO 8601 UTC string
  readonly timezone: string | null; // e.g. 'Asia/Tehran'
}

export interface NoteRecord {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: string; // Serialized JSON array of strings e.g. '["work","meeting"]'
  readonly is_pinned: number; // 0 | 1 in SQLite
  readonly created_at: string; // ISO 8601 UTC string
  readonly updated_at: string; // ISO 8601 UTC string
}

export interface ConversationRecord {
  readonly id: string;
  readonly title: string;
  readonly created_at: string; // ISO 8601 UTC string
  readonly updated_at: string; // ISO 8601 UTC string
  readonly metadata: string | null; // Serialized JSON object
}

export interface MessageRecord {
  readonly id: string;
  readonly conversation_id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly metadata: string | null; // Serialized JSON object (intent, confidence, etc.)
  readonly created_at: string; // ISO 8601 UTC string
}
