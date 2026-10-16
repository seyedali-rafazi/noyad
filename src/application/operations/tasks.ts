/**
 * Task Operation Contracts
 *
 * Defines explicit input, output, and validation contracts for:
 * - create_task
 * - update_task
 * - complete_task
 * - delete_task
 * - list_tasks
 *
 * Boundary rules:
 * - Identification of target records is mandatory for updates and deletions.
 * - Missing or invalid identifiers return structured validation errors.
 * - Destructive operations (delete_task) support confirmation policies.
 * - No direct database or CRUD execution is implemented in this phase.
 */

import { Task } from '../../domain/models/task';
import {
  TaskId,
  TaskPriority,
  TaskStatus,
  IsoDateTimeString,
  OperationSource,
} from '../../domain/types/common';
import { OperationResult } from './types';
import {
  FieldValidationError,
  createValidationError,
  ValidationError,
} from '../../domain/errors';
import { validateEntityIdentifier } from '../../domain/rules/identifier';
import {
  validateTaskTitle,
  validateIsoDateTime,
  validateTaskPriority,
  validateTaskStatus,
} from '../../domain/rules/task';

/* -------------------------------------------------------------------------- */
/*                              1. CREATE_TASK                                */
/* -------------------------------------------------------------------------- */

export interface CreateTaskInput {
  readonly title: string;
  readonly description?: string | null;
  readonly dueDate?: IsoDateTimeString | null;
  readonly isAllDay?: boolean;
  readonly priority?: TaskPriority;
  readonly timezone?: string;
  readonly source?: OperationSource;
}

export type CreateTaskResult = OperationResult<Task>;

export function validateCreateTaskInput(
  input: unknown
): { isValid: true; value: CreateTaskInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError(
        [{ field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' }]
      ),
    };
  }

  const raw = input as Partial<CreateTaskInput>;
  const errors: FieldValidationError[] = [];

  const titleResult = validateTaskTitle(raw.title);
  if (!titleResult.isValid) {
    errors.push(...titleResult.error.details.fields);
  }

  let validatedDueDate: string | null = null;
  if (raw.dueDate !== undefined && raw.dueDate !== null) {
    const dueResult = validateIsoDateTime(raw.dueDate, 'dueDate');
    if (!dueResult.isValid) {
      errors.push(...dueResult.error.details.fields);
    } else {
      validatedDueDate = dueResult.value;
    }
  }

  let validatedPriority: TaskPriority = 'medium';
  if (raw.priority !== undefined) {
    const priorityResult = validateTaskPriority(raw.priority);
    if (!priorityResult.isValid) {
      errors.push(...priorityResult.error.details.fields);
    } else {
      validatedPriority = priorityResult.value;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: createValidationError(errors) };
  }

  return {
    isValid: true,
    value: {
      title: titleResult.isValid ? titleResult.value : (raw.title as string).trim(),
      description: typeof raw.description === 'string' ? raw.description.trim() || null : null,
      dueDate: validatedDueDate,
      isAllDay: raw.isAllDay ?? false,
      priority: validatedPriority,
      timezone: raw.timezone,
      source: raw.source ?? 'user',
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              2. UPDATE_TASK                                */
/* -------------------------------------------------------------------------- */

export interface UpdateTaskInput {
  /**
   * Unique identifier of the target task. Mandatory.
   */
  readonly id: TaskId;
  readonly title?: string;
  readonly description?: string | null;
  readonly dueDate?: IsoDateTimeString | null;
  readonly isAllDay?: boolean;
  readonly priority?: TaskPriority;
  readonly status?: TaskStatus;
  readonly source?: OperationSource;
  readonly confirmed?: boolean;
}

export type UpdateTaskResult = OperationResult<Task>;

export function validateUpdateTaskInput(
  input: unknown
): { isValid: true; value: UpdateTaskInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError(
        [{ field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' }]
      ),
    };
  }

  const raw = input as Partial<UpdateTaskInput>;
  const errors: FieldValidationError[] = [];

  const idResult = validateEntityIdentifier(raw.id, 'id');
  if (!idResult.isValid) {
    errors.push(...idResult.error.details.fields);
  }

  let validatedTitle: string | undefined = undefined;
  if (raw.title !== undefined) {
    const titleResult = validateTaskTitle(raw.title);
    if (!titleResult.isValid) {
      errors.push(...titleResult.error.details.fields);
    } else {
      validatedTitle = titleResult.value;
    }
  }

  let validatedDueDate: string | null | undefined = undefined;
  if (raw.dueDate !== undefined) {
    if (raw.dueDate === null) {
      validatedDueDate = null;
    } else {
      const dueResult = validateIsoDateTime(raw.dueDate, 'dueDate');
      if (!dueResult.isValid) {
        errors.push(...dueResult.error.details.fields);
      } else {
        validatedDueDate = dueResult.value;
      }
    }
  }

  let validatedPriority: TaskPriority | undefined = undefined;
  if (raw.priority !== undefined) {
    const priorityResult = validateTaskPriority(raw.priority);
    if (!priorityResult.isValid) {
      errors.push(...priorityResult.error.details.fields);
    } else {
      validatedPriority = priorityResult.value;
    }
  }

  let validatedStatus: TaskStatus | undefined = undefined;
  if (raw.status !== undefined) {
    const statusResult = validateTaskStatus(raw.status);
    if (!statusResult.isValid) {
      errors.push(...statusResult.error.details.fields);
    } else {
      validatedStatus = statusResult.value;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: createValidationError(errors) };
  }

  return {
    isValid: true,
    value: {
      id: idResult.isValid ? idResult.value : (raw.id as string),
      title: validatedTitle,
      description: raw.description !== undefined ? (raw.description ? raw.description.trim() : null) : undefined,
      dueDate: validatedDueDate,
      isAllDay: raw.isAllDay,
      priority: validatedPriority,
      status: validatedStatus,
      source: raw.source ?? 'user',
      confirmed: raw.confirmed ?? false,
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                            3. COMPLETE_TASK                                */
/* -------------------------------------------------------------------------- */

export interface CompleteTaskInput {
  /**
   * Unique identifier of the target task. Mandatory.
   */
  readonly id: TaskId;
  /**
   * Optional completion timestamp override (UTC ISO 8601).
   */
  readonly completedAt?: IsoDateTimeString;
  readonly source?: OperationSource;
}

export type CompleteTaskResult = OperationResult<Task>;

export function validateCompleteTaskInput(
  input: unknown
): { isValid: true; value: CompleteTaskInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError(
        [{ field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' }]
      ),
    };
  }

  const raw = input as Partial<CompleteTaskInput>;
  const errors: FieldValidationError[] = [];

  const idResult = validateEntityIdentifier(raw.id, 'id');
  if (!idResult.isValid) {
    errors.push(...idResult.error.details.fields);
  }

  let validatedCompletedAt: string | undefined = undefined;
  if (raw.completedAt !== undefined) {
    const dateResult = validateIsoDateTime(raw.completedAt, 'completedAt');
    if (!dateResult.isValid) {
      errors.push(...dateResult.error.details.fields);
    } else {
      validatedCompletedAt = dateResult.value ?? undefined;
    }
  }

  if (errors.length > 0) {
    return { isValid: false, error: createValidationError(errors) };
  }

  return {
    isValid: true,
    value: {
      id: idResult.isValid ? idResult.value : (raw.id as string),
      completedAt: validatedCompletedAt,
      source: raw.source ?? 'user',
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                             4. DELETE_TASK                                 */
/* -------------------------------------------------------------------------- */

export interface DeleteTaskInput {
  /**
   * Unique identifier of the target task to delete. Mandatory.
   */
  readonly id: TaskId;
  /**
   * Whether the user has explicitly confirmed deletion in UI dialog.
   * If false and confirmation policy applies, operation yields requiresConfirmation: true.
   */
  readonly confirmed?: boolean;
  readonly source?: OperationSource;
}

export interface DeleteTaskSuccessPayload {
  readonly id: TaskId;
  readonly deleted: true;
}

export type DeleteTaskResult = OperationResult<DeleteTaskSuccessPayload>;

export function validateDeleteTaskInput(
  input: unknown
): { isValid: true; value: DeleteTaskInput } | { isValid: false; error: ValidationError } {
  if (typeof input !== 'object' || input === null) {
    return {
      isValid: false,
      error: createValidationError(
        [{ field: 'input', message: 'Input must be a non-null object', code: 'TYPE_MISMATCH' }]
      ),
    };
  }

  const raw = input as Partial<DeleteTaskInput>;
  const idResult = validateEntityIdentifier(raw.id, 'id');
  if (!idResult.isValid) {
    return { isValid: false, error: idResult.error };
  }

  return {
    isValid: true,
    value: {
      id: idResult.value,
      confirmed: raw.confirmed ?? false,
      source: raw.source ?? 'user',
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                              5. LIST_TASKS                                 */
/* -------------------------------------------------------------------------- */

export interface ListTasksFilter {
  readonly status?: TaskStatus | readonly TaskStatus[];
  readonly priority?: TaskPriority | readonly TaskPriority[];
  readonly dueDateFrom?: IsoDateTimeString; // UTC ISO 8601
  readonly dueDateTo?: IsoDateTimeString; // UTC ISO 8601
  readonly searchQuery?: string;
}

export interface ListTasksSort {
  readonly field: 'dueDate' | 'priority' | 'createdAt' | 'title';
  readonly direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  readonly limit?: number;
  readonly offset?: number;
}

export interface ListTasksInput {
  readonly filter?: ListTasksFilter;
  readonly sort?: ListTasksSort;
  readonly pagination?: PaginationOptions;
}

export interface ListTasksOutput {
  readonly tasks: readonly Task[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}

export type ListTasksResult = OperationResult<ListTasksOutput>;
