/**
 * Task Domain Model
 *
 * Core business entity representing a task or reminder in the daily planner.
 */

import {
  TaskId,
  TaskPriority,
  TaskStatus,
  IsoDateTimeString,
} from '../types/common';

export interface Task {
  readonly id: TaskId;
  readonly title: string;
  readonly description: string | null;
  /**
   * Due timestamp in UTC ISO 8601 format.
   * Null if no due date/time is scheduled.
   */
  readonly dueDate: IsoDateTimeString | null;
  /**
   * Flag indicating whether the task is an all-day event or has a specific due time.
   */
  readonly isAllDay: boolean;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  /**
   * Timestamp when the task was marked completed in UTC ISO 8601 format.
   * Null if the task is not completed.
   */
  readonly completedAt: IsoDateTimeString | null;
  /**
   * Task creation timestamp in UTC ISO 8601 format.
   */
  readonly createdAt: IsoDateTimeString;
  /**
   * Task last update timestamp in UTC ISO 8601 format.
   */
  readonly updatedAt: IsoDateTimeString;
  /**
   * Timezone in which the task was scheduled (e.g. 'Asia/Tehran').
   */
  readonly timezone?: string;
}

/**
 * Task creation parameters for the domain factory.
 */
export interface CreateTaskProps {
  readonly id: TaskId;
  readonly title: string;
  readonly description?: string | null;
  readonly dueDate?: IsoDateTimeString | null;
  readonly isAllDay?: boolean;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly completedAt?: IsoDateTimeString | null;
  readonly createdAt?: IsoDateTimeString;
  readonly updatedAt?: IsoDateTimeString;
  readonly timezone?: string;
}

/**
 * Pure domain factory function creating a Task entity with default invariant enforcement.
 */
export function createTask(props: CreateTaskProps): Task {
  const now = new Date().toISOString();
  const status = props.status ?? 'pending';

  // Invariant: If status is completed and no completedAt is given, default to current timestamp.
  // If status is not completed, completedAt must be null.
  const completedAt =
    status === 'completed'
      ? (props.completedAt ?? now)
      : null;

  return {
    id: props.id,
    title: props.title.trim(),
    description: props.description ?? null,
    dueDate: props.dueDate ?? null,
    isAllDay: props.isAllDay ?? false,
    priority: props.priority ?? 'medium',
    status,
    completedAt,
    createdAt: props.createdAt ?? now,
    updatedAt: props.updatedAt ?? now,
    timezone: props.timezone,
  };
}
