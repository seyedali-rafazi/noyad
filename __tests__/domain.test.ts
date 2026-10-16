/**
 * Unit Tests for Domain Models, Business Rules, Error Contracts, and Application Operations
 */

import {
  createTask,
  createNote,
  createConversation,
  createMessage,
  validateTaskTitle,
  validateIsoDateTime,
  validateTaskPriority,
  validateTaskStatus,
  validateTaskStatusTransition,
  resolveTaskCompletionState,
  validateNoteTitle,
  validateNoteContent,
  normalizeNoteTags,
  validateEntityIdentifier,
  createValidationError,
  createNotFoundError,
  createConflictError,
  createDatabaseError,
  createAiValidationFailureError,
  createAmbiguousRequestError,
  isApplicationError,
  isValidationError,
  isNotFoundError,
  isConflictError,
  isDatabaseError,
  isAiValidationFailureError,
  isAmbiguousRequestError,
  TASK_RULES,
  NOTE_RULES,
} from '../src/domain';

import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validateCompleteTaskInput,
  validateDeleteTaskInput,
  validateCreateNoteInput,
  validateUpdateNoteInput,
  validateDeleteNoteInput,
  defaultConfirmationPolicy,
  sanitizeAndValidateAiTaskPayload,
  sanitizeAndValidateAiNotePayload,
  createAmbiguousMatchResolution,
  successResult,
  failureResult,
  confirmationRequiredResult,
} from '../src/application';

describe('Domain Models & Entity Invariants', () => {
  it('creates a task entity with proper default invariants', () => {
    const task = createTask({
      id: 'task-1',
      title: '   بررسی گزارش ماهانه   ',
    });

    expect(task.id).toBe('task-1');
    expect(task.title).toBe('بررسی گزارش ماهانه');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeNull();
    expect(task.isAllDay).toBe(false);
    expect(task.completedAt).toBeNull();
    expect(task.createdAt).toBeDefined();
    expect(task.updatedAt).toBeDefined();
  });

  it('enforces completedAt invariant on task creation when status is completed', () => {
    const task = createTask({
      id: 'task-2',
      title: 'خرید تجهیزات',
      status: 'completed',
    });

    expect(task.status).toBe('completed');
    expect(task.completedAt).toBeDefined();
    expect(typeof task.completedAt).toBe('string');
  });

  it('clears completedAt when task status is not completed', () => {
    const task = createTask({
      id: 'task-3',
      title: 'جلسه بازبینی',
      status: 'pending',
      completedAt: '2026-10-15T12:00:00.000Z',
    });

    expect(task.status).toBe('pending');
    expect(task.completedAt).toBeNull();
  });

  it('creates a note entity with tag normalization and deduplication', () => {
    const note = createNote({
      id: 'note-1',
      title: 'یادداشت مهم',
      content: 'متن یادداشت',
      tags: ['  Work  ', 'work', 'PLANNING', ''],
    });

    expect(note.id).toBe('note-1');
    expect(note.title).toBe('یادداشت مهم');
    expect(note.tags).toEqual(['work', 'planning']);
    expect(note.isPinned).toBe(false);
  });

  it('creates conversation and message entities correctly', () => {
    const conv = createConversation({
      id: 'conv-1',
      title: 'برنامه‌ریزی هفته',
    });
    expect(conv.id).toBe('conv-1');
    expect(conv.title).toBe('برنامه‌ریزی هفته');

    const msg = createMessage({
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'تسک جلسه فردا را اضافه کن',
    });
    expect(msg.id).toBe('msg-1');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('تسک جلسه فردا را اضافه کن');
  });
});

describe('Domain Business Rules & Validation', () => {
  describe('Task Title Validation', () => {
    it('accepts valid trimmed titles', () => {
      const result = validateTaskTitle('   جلسه کاری   ');
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.value).toBe('جلسه کاری');
      }
    });

    it('rejects empty or whitespace-only titles', () => {
      const result = validateTaskTitle('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details.fields[0].code).toBe('TITLE_EMPTY');
      }
    });

    it('rejects titles exceeding max length', () => {
      const longTitle = 'a'.repeat(TASK_RULES.TITLE_MAX_LENGTH + 1);
      const result = validateTaskTitle(longTitle);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error.details.fields[0].code).toBe('TITLE_TOO_LONG');
      }
    });

    it('rejects non-string input', () => {
      const result = validateTaskTitle(12345);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error.details.fields[0].code).toBe('TYPE_MISMATCH');
      }
    });
  });

  describe('ISO Timestamp & Persian Storage Invariants', () => {
    it('accepts valid UTC ISO 8601 strings', () => {
      const iso = '2026-10-15T15:30:00.000Z';
      const result = validateIsoDateTime(iso);
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.value).toBe(iso);
      }
    });

    it('accepts null or undefined as optional', () => {
      expect(validateIsoDateTime(null).isValid).toBe(true);
      expect(validateIsoDateTime(undefined).isValid).toBe(true);
    });

    it('REJECTS localized Jalali strings or Persian numerals in storage timestamp', () => {
      // Must enforce the strict persistence rule: no localized Jalali in database/domain timestamps
      const jalaliStr = '۱۴۰۵/۰۷/۲۴';
      const result = validateIsoDateTime(jalaliStr);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error.details.fields[0].code).toBe('INVALID_TIMESTAMP_FORMAT');
      }
    });

    it('rejects non-parseable date strings', () => {
      const result = validateIsoDateTime('not-a-date');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error.details.fields[0].code).toBe('INVALID_TIMESTAMP');
      }
    });
  });

  describe('Task Priority and Status Validation', () => {
    it('validates allowed priorities', () => {
      expect(validateTaskPriority('low').isValid).toBe(true);
      expect(validateTaskPriority('medium').isValid).toBe(true);
      expect(validateTaskPriority('high').isValid).toBe(true);
      expect(validateTaskPriority('urgent').isValid).toBe(true);
      expect(validateTaskPriority('extreme').isValid).toBe(false);
    });

    it('validates allowed statuses', () => {
      expect(validateTaskStatus('pending').isValid).toBe(true);
      expect(validateTaskStatus('in_progress').isValid).toBe(true);
      expect(validateTaskStatus('completed').isValid).toBe(true);
      expect(validateTaskStatus('cancelled').isValid).toBe(true);
      expect(validateTaskStatus('archived').isValid).toBe(false);
    });
  });

  describe('Task State Machine Transitions', () => {
    it('allows valid state transitions', () => {
      expect(validateTaskStatusTransition('pending', 'in_progress').isAllowed).toBe(true);
      expect(validateTaskStatusTransition('in_progress', 'completed').isAllowed).toBe(true);
      expect(validateTaskStatusTransition('completed', 'pending').isAllowed).toBe(true); // Reopening
      expect(validateTaskStatusTransition('cancelled', 'pending').isAllowed).toBe(true); // Reactivating
    });

    it('disallows invalid state transitions and returns ConflictError', () => {
      const result = validateTaskStatusTransition('cancelled', 'completed');
      expect(result.isAllowed).toBe(false);
      if (!result.isAllowed) {
        expect(result.error.code).toBe('CONFLICT');
        expect(result.error.details.entityType).toBe('task');
      }
    });

    it('resolves task completion state and timestamps properly', () => {
      const completed = resolveTaskCompletionState('completed');
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      const reopened = resolveTaskCompletionState('pending');
      expect(reopened.status).toBe('pending');
      expect(reopened.completedAt).toBeNull();
    });
  });

  describe('Note Validation Rules', () => {
    it('validates note title', () => {
      expect(validateNoteTitle('جلسه').isValid).toBe(true);
      expect(validateNoteTitle('').isValid).toBe(false);
    });

    it('validates note content length limit', () => {
      const validContent = 'متن معمولی';
      expect(validateNoteContent(validContent).isValid).toBe(true);

      const hugeContent = 'a'.repeat(NOTE_RULES.CONTENT_MAX_LENGTH + 10);
      expect(validateNoteContent(hugeContent).isValid).toBe(false);
    });

    it('normalizes, deduplicates and bounds-checks note tags', () => {
      const raw = [' Project ', 'project', 'finance', ''];
      const res = normalizeNoteTags(raw);
      expect(res.isValid).toBe(true);
      if (res.isValid) {
        expect(res.value).toEqual(['project', 'finance']);
      }

      // Reject tag exceeding length limit
      const longTag = ['a'.repeat(NOTE_RULES.TAG_MAX_LENGTH + 1)];
      expect(normalizeNoteTags(longTag).isValid).toBe(false);
    });
  });

  describe('Identifier Validation', () => {
    it('validates non-empty entity identifier', () => {
      expect(validateEntityIdentifier('valid-id-123').isValid).toBe(true);
      expect(validateEntityIdentifier('').isValid).toBe(false);
      expect(validateEntityIdentifier('   ').isValid).toBe(false);
      expect(validateEntityIdentifier(null).isValid).toBe(false);
    });
  });
});

describe('Error Contracts & Type Guards', () => {
  it('instantiates and typeguards all 6 error variants', () => {
    const valErr = createValidationError([{ field: 'title', message: 'Title is required' }]);
    expect(isApplicationError(valErr)).toBe(true);
    expect(isValidationError(valErr)).toBe(true);
    expect(isNotFoundError(valErr)).toBe(false);

    const notFoundErr = createNotFoundError('task', 'task-999');
    expect(isApplicationError(notFoundErr)).toBe(true);
    expect(isNotFoundError(notFoundErr)).toBe(true);

    const conflictErr = createConflictError('task', 'Concurrency conflict');
    expect(isApplicationError(conflictErr)).toBe(true);
    expect(isConflictError(conflictErr)).toBe(true);

    const dbErr = createDatabaseError(new Error('Disk I/O error'));
    expect(isApplicationError(dbErr)).toBe(true);
    expect(isDatabaseError(dbErr)).toBe(true);
    expect(dbErr.details.cause).toBe('Disk I/O error');

    const aiErr = createAiValidationFailureError('Malformed JSON payload');
    expect(isApplicationError(aiErr)).toBe(true);
    expect(isAiValidationFailureError(aiErr)).toBe(true);

    const ambigErr = createAmbiguousRequestError(
      'جلسه',
      [{ id: '1', title: 'جلسه کاری', entityType: 'task' }],
      'کدام جلسه؟'
    );
    expect(isApplicationError(ambigErr)).toBe(true);
    expect(isAmbiguousRequestError(ambigErr)).toBe(true);
  });
});

describe('Application Operations Contracts & Validation', () => {
  describe('Task Operations', () => {
    it('validates CreateTaskInput correctly', () => {
      const valid = validateCreateTaskInput({
        title: 'ارسال ایمیل',
        priority: 'high',
        dueDate: '2026-10-15T18:00:00.000Z',
      });
      expect(valid.isValid).toBe(true);
      if (valid.isValid) {
        expect(valid.value.title).toBe('ارسال ایمیل');
        expect(valid.value.priority).toBe('high');
        expect(valid.value.source).toBe('user');
      }

      const invalid = validateCreateTaskInput({ title: '' });
      expect(invalid.isValid).toBe(false);
    });

    it('requires target identifier for UpdateTaskInput', () => {
      const missingId = validateUpdateTaskInput({ title: 'تغییر عنوان' });
      expect(missingId.isValid).toBe(false);
      if (!missingId.isValid) {
        expect(missingId.error.details.fields.some((f) => f.field === 'id')).toBe(true);
      }

      const validUpdate = validateUpdateTaskInput({ id: 'task-1', title: 'عنوان جدید' });
      expect(validUpdate.isValid).toBe(true);
    });

    it('requires target identifier for CompleteTaskInput', () => {
      expect(validateCompleteTaskInput({ id: '' }).isValid).toBe(false);
      expect(validateCompleteTaskInput({ id: 'task-1' }).isValid).toBe(true);
    });

    it('requires target identifier for DeleteTaskInput', () => {
      expect(validateDeleteTaskInput({ id: '   ' }).isValid).toBe(false);
      const validDelete = validateDeleteTaskInput({ id: 'task-1', confirmed: true });
      expect(validDelete.isValid).toBe(true);
      if (validDelete.isValid) {
        expect(validDelete.value.confirmed).toBe(true);
      }
    });
  });

  describe('Note Operations', () => {
    it('validates CreateNoteInput', () => {
      const valid = validateCreateNoteInput({
        title: 'یادداشت',
        content: 'محتوا',
        tags: ['tag1'],
      });
      expect(valid.isValid).toBe(true);

      const invalid = validateCreateNoteInput({ title: '', content: '' });
      expect(invalid.isValid).toBe(false);
    });

    it('requires target identifier for UpdateNoteInput and DeleteNoteInput', () => {
      expect(validateUpdateNoteInput({ title: 'جدید' }).isValid).toBe(false);
      expect(validateDeleteNoteInput({ id: '' }).isValid).toBe(false);
      expect(validateDeleteNoteInput({ id: 'note-1' }).isValid).toBe(true);
    });
  });

  describe('Operation Result Helpers', () => {
    it('creates standard success, failure, and confirmation results', () => {
      const succ = successResult({ id: '1', title: 'Task' });
      expect(succ.success).toBe(true);
      expect(succ.data.title).toBe('Task');

      const fail = failureResult(createNotFoundError('task', '1'));
      expect(fail.success).toBe(false);
      expect(fail.error.code).toBe('NOT_FOUND');

      const conf = confirmationRequiredResult(
        defaultConfirmationPolicy.createConfirmationRequest({
          actionType: 'delete_task',
          targetId: 'task-1',
          targetTitle: 'جلسه',
          source: 'user',
        })
      );
      expect(conf.success).toBe(false);
      expect(conf.requiresConfirmation).toBe(true);
      expect(conf.confirmation.token).toBeDefined();
    });
  });
});

describe('Destructive Operation Confirmation Policy', () => {
  it('triggers confirmation for deletions when not confirmed', () => {
    const isRequired = defaultConfirmationPolicy.requiresConfirmation({
      actionType: 'delete_task',
      targetId: 'task-1',
      targetTitle: 'جلسه هیئت مدیره',
      source: 'user',
      confirmed: false,
    });
    expect(isRequired).toBe(true);
  });

  it('bypasses confirmation when user has explicitly confirmed', () => {
    const isRequired = defaultConfirmationPolicy.requiresConfirmation({
      actionType: 'delete_task',
      targetId: 'task-1',
      targetTitle: 'جلسه هیئت مدیره',
      source: 'user',
      confirmed: true,
    });
    expect(isRequired).toBe(false);
  });

  it('ALWAYS requires confirmation for AI-generated destructive operations', () => {
    const isRequired = defaultConfirmationPolicy.requiresConfirmation({
      actionType: 'delete_task',
      targetId: 'task-1',
      targetTitle: 'جلسه هیئت مدیره',
      source: 'ai',
      confirmed: false,
    });
    expect(isRequired).toBe(true);
  });

  it('generates Persian confirmation prompt for user UI', () => {
    const req = defaultConfirmationPolicy.createConfirmationRequest({
      actionType: 'delete_task',
      targetId: 'task-1',
      targetTitle: 'جلسه هفتگی',
      source: 'user',
    });

    expect(req.actionType).toBe('delete_task');
    expect(req.isDestructive).toBe(true);
    expect(req.severity).toBe('critical');
    expect(req.promptPersian).toContain('«جلسه هفتگی»');
  });
});

describe('Untrusted AI Payload Validation & Ambiguity Handling', () => {
  it('sanitizes AI task payload and strips prompt wrappers', () => {
    const rawAiPayload = {
      title: '  تسک: «بررسی مدارک مالی»  ',
      priority: 'HIGH',
      dueDate: '2026-10-16T10:00:00.000Z',
      isAllDay: false,
    };

    const result = sanitizeAndValidateAiTaskPayload(rawAiPayload);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.title).toBe('بررسی مدارک مالی');
      expect(result.data.priority).toBe('high');
      expect(result.data.source).toBe('ai');
    }
  });

  it('rejects AI task payload with missing title and returns AiValidationFailureError', () => {
    const rawAiPayload = {
      dueDate: '2026-10-16T10:00:00.000Z',
    };

    const result = sanitizeAndValidateAiTaskPayload(rawAiPayload);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error.code).toBe('AI_VALIDATION_FAILURE');
      expect(result.error.details.validationIssues).toBeDefined();
    }
  });

  it('rejects AI payload containing Jalali localized strings in timestamp field', () => {
    const rawAiPayload = {
      title: 'خرید کتاب',
      dueDate: '۱۴۰۵/۰۷/۲۵', // Localized Jalali string - not allowed in storage!
    };

    const result = sanitizeAndValidateAiTaskPayload(rawAiPayload);
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.error.code).toBe('AI_VALIDATION_FAILURE');
    }
  });

  it('sanitizes untrusted AI note payload', () => {
    const rawAiNote = {
      title: '  یادداشت سفر  ',
      content: 'خرید بلیت و رزرو هتل',
      tags: ['travel', 'hotel'],
    };

    const result = sanitizeAndValidateAiNotePayload(rawAiNote);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.data.title).toBe('یادداشت سفر');
      expect(result.data.source).toBe('ai');
    }
  });

  it('creates structured AmbiguousRequestError for ambiguous user queries', () => {
    const ambiguity = createAmbiguousMatchResolution('جلسه', [
      { id: 't-1', title: 'جلسه اول', entityType: 'task' },
      { id: 't-2', title: 'جلسه دوم', entityType: 'task' },
    ]);

    expect(ambiguity.code).toBe('AMBIGUOUS_REQUEST');
    expect(ambiguity.details.candidateMatches.length).toBe(2);
    expect(ambiguity.details.clarificationPrompt).toContain('جلسه اول');
    expect(ambiguity.details.clarificationPrompt).toContain('جلسه دوم');
  });
});
