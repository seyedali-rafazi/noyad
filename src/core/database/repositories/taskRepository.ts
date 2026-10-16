import { eq, and, inArray, gte, lte, like, desc, asc, count, SQL } from 'drizzle-orm';
import { getDatabase, type AppDatabase } from '../client';
import { tasks, type TaskSelect } from '../schema/tasks';
import { Task, createTask } from '../../../domain/models/task';
import { TaskId, TaskPriority, TaskStatus } from '../../../domain/types/common';
import { ITaskRepository } from '../../../application/ports/repositories';
import {
  ListTasksFilter,
  ListTasksSort,
  PaginationOptions,
} from '../../../application/operations/tasks';

export function mapTaskRecordToDomain(record: TaskSelect): Task {
  return createTask({
    id: record.id,
    title: record.title,
    description: record.description,
    dueDate: record.dueDate,
    isAllDay: record.isAllDay === 1,
    priority: record.priority,
    status: record.status,
    completedAt: record.completedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    timezone: record.timezone ?? undefined,
  });
}

export function mapTaskDomainToInsert(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    isAllDay: task.isAllDay ? 1 : 0,
    priority: task.priority,
    status: task.status,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    timezone: task.timezone ?? null,
  };
}

export class SqliteTaskRepository implements ITaskRepository {
  constructor(private readonly getDb: () => AppDatabase = getDatabase) {}

  async findById(id: TaskId): Promise<Task | null> {
    const db = this.getDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    return mapTaskRecordToDomain(rows[0]);
  }

  async findMany(options?: {
    filter?: ListTasksFilter;
    sort?: ListTasksSort;
    pagination?: PaginationOptions;
  }): Promise<{ tasks: readonly Task[]; totalCount: number }> {
    const db = this.getDb();
    const conditions: SQL[] = [];

    if (options?.filter) {
      const { status, priority, dueDateFrom, dueDateTo, searchQuery } =
        options.filter;

      if (status !== undefined) {
        if (Array.isArray(status)) {
          if (status.length > 0) {
            conditions.push(inArray(tasks.status, [...status]));
          }
        } else {
          conditions.push(eq(tasks.status, status as TaskStatus));
        }
      }

      if (priority !== undefined) {
        if (Array.isArray(priority)) {
          if (priority.length > 0) {
            conditions.push(inArray(tasks.priority, [...priority]));
          }
        } else {
          conditions.push(eq(tasks.priority, priority as TaskPriority));
        }
      }

      if (dueDateFrom) {
        conditions.push(gte(tasks.dueDate, dueDateFrom));
      }

      if (dueDateTo) {
        conditions.push(lte(tasks.dueDate, dueDateTo));
      }

      if (searchQuery && searchQuery.trim().length > 0) {
        conditions.push(like(tasks.title, `%${searchQuery.trim()}%`));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total matching items
    const countQuery = db
      .select({ total: count() })
      .from(tasks);
    if (whereClause) {
      countQuery.where(whereClause);
    }
    const countResult = await countQuery;
    const totalCount = countResult[0]?.total ?? 0;

    // Sorting
    let orderByClause = desc(tasks.createdAt);
    if (options?.sort) {
      const { field, direction } = options.sort;
      const dirFn = direction === 'asc' ? asc : desc;
      switch (field) {
        case 'dueDate':
          orderByClause = dirFn(tasks.dueDate);
          break;
        case 'priority':
          orderByClause = dirFn(tasks.priority);
          break;
        case 'title':
          orderByClause = dirFn(tasks.title);
          break;
        case 'createdAt':
        default:
          orderByClause = dirFn(tasks.createdAt);
          break;
      }
    }

    const query = db
      .select()
      .from(tasks);

    if (whereClause) {
      query.where(whereClause);
    }

    query.orderBy(orderByClause);

    if (options?.pagination?.limit !== undefined) {
      query.limit(options.pagination.limit);
    }
    if (options?.pagination?.offset !== undefined) {
      query.offset(options.pagination.offset);
    }

    const rows = await query;
    return {
      tasks: rows.map(mapTaskRecordToDomain),
      totalCount,
    };
  }

  async create(task: Task): Promise<Task> {
    const db = this.getDb();
    const values = mapTaskDomainToInsert(task);
    await db.insert(tasks).values(values);
    return task;
  }

  async update(task: Task): Promise<Task> {
    const db = this.getDb();
    const values = mapTaskDomainToInsert(task);
    await db.update(tasks).set(values).where(eq(tasks.id, task.id));
    return task;
  }

  async delete(id: TaskId): Promise<boolean> {
    const db = this.getDb();
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  }
}

export const taskRepository = new SqliteTaskRepository();
