/**
 * Note Domain Model
 *
 * Core business entity representing a rich-text or quick note in the planner.
 */

import { NoteId, IsoDateTimeString } from '../types/common';

export interface Note {
  readonly id: NoteId;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly isPinned: boolean;
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
}

export interface CreateNoteProps {
  readonly id: NoteId;
  readonly title: string;
  readonly content: string;
  readonly tags?: readonly string[];
  readonly isPinned?: boolean;
  readonly createdAt?: IsoDateTimeString;
  readonly updatedAt?: IsoDateTimeString;
}

/**
 * Pure domain factory function creating a Note entity with invariant enforcement.
 */
export function createNote(props: CreateNoteProps): Note {
  const now = new Date().toISOString();

  // Normalize tags: lowercase, trim, deduplicate, filter empty
  const rawTags = props.tags ?? [];
  const normalizedTags = Array.from(
    new Set(
      rawTags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0)
    )
  );

  return {
    id: props.id,
    title: props.title.trim(),
    content: props.content,
    tags: Object.freeze(normalizedTags),
    isPinned: props.isPinned ?? false,
    createdAt: props.createdAt ?? now,
    updatedAt: props.updatedAt ?? now,
  };
}
