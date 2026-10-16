import { eq, and, or, like, desc, count, SQL } from 'drizzle-orm';
import { getDatabase, type AppDatabase } from '../client';
import { notes, type NoteSelect } from '../schema/notes';
import { Note, createNote } from '../../../domain/models/note';
import { NoteId } from '../../../domain/types/common';
import { INoteRepository } from '../../../application/ports/repositories';
import { PaginationOptions } from '../../../application/operations/tasks';

export function mapNoteRecordToDomain(record: NoteSelect): Note {
  let tags: string[] = [];
  try {
    tags = JSON.parse(record.tags);
    if (!Array.isArray(tags)) {
      tags = [];
    }
  } catch {
    tags = [];
  }

  return createNote({
    id: record.id,
    title: record.title,
    content: record.content,
    tags,
    isPinned: record.isPinned === 1,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

export function mapNoteDomainToInsert(note: Note) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    tags: JSON.stringify(note.tags ?? []),
    isPinned: note.isPinned ? 1 : 0,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export class SqliteNoteRepository implements INoteRepository {
  constructor(private readonly getDb: () => AppDatabase = getDatabase) {}

  async findById(id: NoteId): Promise<Note | null> {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(notes)
      .where(eq(notes.id, id))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return mapNoteRecordToDomain(rows[0]);
  }

  async findMany(options?: {
    tag?: string;
    isPinned?: boolean;
    searchQuery?: string;
    pagination?: PaginationOptions;
  }): Promise<{ notes: readonly Note[]; totalCount: number }> {
    const db = this.getDb();
    const conditions: SQL[] = [];

    if (options?.isPinned !== undefined) {
      conditions.push(eq(notes.isPinned, options.isPinned ? 1 : 0));
    }

    if (options?.tag && options.tag.trim().length > 0) {
      conditions.push(like(notes.tags, `%"${options.tag.trim().toLowerCase()}"%`));
    }

    if (options?.searchQuery && options.searchQuery.trim().length > 0) {
      const q = `%${options.searchQuery.trim()}%`;
      conditions.push(or(like(notes.title, q), like(notes.content, q))!);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countQuery = db
      .select({ total: count() })
      .from(notes);
    if (whereClause) {
      countQuery.where(whereClause);
    }
    const countResult = await countQuery;
    const totalCount = countResult[0]?.total ?? 0;

    // Pinned first, then by updatedAt descending
    const query = db
      .select()
      .from(notes);

    if (whereClause) {
      query.where(whereClause);
    }

    query.orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    if (options?.pagination?.limit !== undefined) {
      query.limit(options.pagination.limit);
    }
    if (options?.pagination?.offset !== undefined) {
      query.offset(options.pagination.offset);
    }

    const rows = await query;
    return {
      notes: rows.map(mapNoteRecordToDomain),
      totalCount,
    };
  }

  async create(note: Note): Promise<Note> {
    const db = this.getDb();
    const values = mapNoteDomainToInsert(note);
    await db.insert(notes).values(values);
    return note;
  }

  async update(note: Note): Promise<Note> {
    const db = this.getDb();
    const values = mapNoteDomainToInsert(note);
    await db.update(notes).set(values).where(eq(notes.id, note.id));
    return note;
  }

  async delete(id: NoteId): Promise<boolean> {
    const db = this.getDb();
    await db.delete(notes).where(eq(notes.id, id));
    return true;
  }
}

export const noteRepository = new SqliteNoteRepository();
