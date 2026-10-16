/**
 * Data Access Port Contracts (Repository Interfaces)
 *
 * Establishes the contract boundary between application orchestration logic and
 * the underlying SQLite / Drizzle ORM persistence layer.
 *
 * Rules:
 * - Application operations and domain services depend strictly on these interfaces.
 * - Repositories return Domain Models, never raw database records or ad-hoc SQL rows.
 * - Concrete implementations reside in feature or infrastructure modules.
 */

import { Task } from '../../domain/models/task';
import { Note } from '../../domain/models/note';
import { Conversation, Message } from '../../domain/models/conversation';
import { TaskId, NoteId, ConversationId } from '../../domain/types/common';
import { ListTasksFilter, ListTasksSort, PaginationOptions } from '../operations/tasks';

export interface ITaskRepository {
  findById(id: TaskId): Promise<Task | null>;
  findMany(options?: {
    filter?: ListTasksFilter;
    sort?: ListTasksSort;
    pagination?: PaginationOptions;
  }): Promise<{ tasks: readonly Task[]; totalCount: number }>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: TaskId): Promise<boolean>;
}

export interface INoteRepository {
  findById(id: NoteId): Promise<Note | null>;
  findMany(options?: {
    tag?: string;
    isPinned?: boolean;
    searchQuery?: string;
    pagination?: PaginationOptions;
  }): Promise<{ notes: readonly Note[]; totalCount: number }>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: NoteId): Promise<boolean>;
}

export interface IConversationRepository {
  findById(id: ConversationId): Promise<Conversation | null>;
  create(conversation: Conversation): Promise<Conversation>;
  listRecent(limit?: number): Promise<readonly Conversation[]>;
  getMessages(conversationId: ConversationId): Promise<readonly Message[]>;
  addMessage(message: Message): Promise<Message>;
  delete(id: ConversationId): Promise<boolean>;
}
