import {
  mapTaskRecordToDomain,
  mapTaskDomainToInsert,
  SqliteTaskRepository,
} from '../src/core/database/repositories/taskRepository';
import {
  mapNoteRecordToDomain,
  mapNoteDomainToInsert,
  SqliteNoteRepository,
} from '../src/core/database/repositories/noteRepository';
import {
  mapConversationRecordToDomain,
  mapMessageRecordToDomain,
  SqliteConversationRepository,
} from '../src/core/database/repositories/conversationRepository';
import { createTask } from '../src/domain/models/task';
import { createNote } from '../src/domain/models/note';
import { createConversation, createMessage } from '../src/domain/models/conversation';
import { usePlannerStore } from '../src/features/planner/plannerStore';

describe('SQLite Repositories & Domain Mapping Tests', () => {
  describe('Task mapping', () => {
    it('correctly maps domain task to database insert values', () => {
      const task = createTask({
        id: 'task-101',
        title: 'بررسی قرارداد',
        description: 'توضیحات تست',
        dueDate: '2026-10-20T10:00:00.000Z',
        isAllDay: true,
        priority: 'high',
        status: 'pending',
        timezone: 'Asia/Tehran',
      });

      const insertValues = mapTaskDomainToInsert(task);
      expect(insertValues.id).toBe('task-101');
      expect(insertValues.title).toBe('بررسی قرارداد');
      expect(insertValues.description).toBe('توضیحات تست');
      expect(insertValues.isAllDay).toBe(1);
      expect(insertValues.priority).toBe('high');
      expect(insertValues.status).toBe('pending');
      expect(insertValues.completedAt).toBeNull();
      expect(insertValues.timezone).toBe('Asia/Tehran');
    });

    it('correctly maps database record to domain model', () => {
      const record = {
        id: 'task-102',
        title: 'جلسه تیم فنی',
        description: null,
        dueDate: '2026-10-21T14:30:00.000Z',
        isAllDay: 0,
        priority: 'urgent' as const,
        status: 'completed' as const,
        completedAt: '2026-10-21T15:00:00.000Z',
        createdAt: '2026-10-20T08:00:00.000Z',
        updatedAt: '2026-10-21T15:00:00.000Z',
        timezone: 'Asia/Tehran',
      };

      const domain = mapTaskRecordToDomain(record);
      expect(domain.id).toBe('task-102');
      expect(domain.title).toBe('جلسه تیم فنی');
      expect(domain.description).toBeNull();
      expect(domain.isAllDay).toBe(false);
      expect(domain.priority).toBe('urgent');
      expect(domain.status).toBe('completed');
      expect(domain.completedAt).toBe('2026-10-21T15:00:00.000Z');
    });
  });

  describe('Note mapping', () => {
    it('correctly serializes tags array into JSON string on insert', () => {
      const note = createNote({
        id: 'note-201',
        title: 'نکات جلسه',
        content: 'متن یادداشت',
        tags: ['کار', 'طراحی'],
        isPinned: true,
      });

      const insert = mapNoteDomainToInsert(note);
      expect(insert.id).toBe('note-201');
      expect(insert.tags).toBe(JSON.stringify(['کار', 'طراحی']));
      expect(insert.isPinned).toBe(1);
    });

    it('correctly parses tags from JSON string and handles corrupted JSON safely', () => {
      const validRecord = {
        id: 'note-202',
        title: 'ایده‌ها',
        content: 'محتوا',
        tags: '["ai","planner"]',
        isPinned: 0,
        createdAt: '2026-10-20T08:00:00.000Z',
        updatedAt: '2026-10-20T08:00:00.000Z',
      };
      const validDomain = mapNoteRecordToDomain(validRecord);
      expect(validDomain.tags).toEqual(['ai', 'planner']);
      expect(validDomain.isPinned).toBe(false);

      const corruptedRecord = {
        ...validRecord,
        id: 'note-203',
        tags: 'invalid-json-string',
      };
      const corruptedDomain = mapNoteRecordToDomain(corruptedRecord);
      expect(corruptedDomain.tags).toEqual([]);
    });
  });

  describe('Conversation and Message mapping', () => {
    it('serializes and deserializes metadata safely', () => {
      const conv = createConversation({
        id: 'conv-1',
        title: 'برنامه‌ریزی روزانه',
        metadata: { source: 'assistant_tab' },
      });
      expect(conv.metadata).toEqual({ source: 'assistant_tab' });

      const convRecord = {
        id: 'conv-2',
        title: 'خلاصه کارها',
        createdAt: '2026-10-20T08:00:00.000Z',
        updatedAt: '2026-10-20T08:00:00.000Z',
        metadata: JSON.stringify({ confidence: 0.95 }),
      };
      const domainConv = mapConversationRecordToDomain(convRecord);
      expect(domainConv.metadata).toEqual({ confidence: 0.95 });

      const msg = createMessage({
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'assistant',
        content: 'برنامه شما ثبت شد.',
        metadata: { detectedIntent: 'create_task' },
      });
      expect(msg.metadata?.detectedIntent).toBe('create_task');

      const msgRecord = {
        id: 'msg-2',
        conversationId: 'conv-1',
        role: 'user' as const,
        content: 'تسک جدید اضافه کن',
        metadata: JSON.stringify({ intent: 'create_task' }),
        createdAt: '2026-10-20T08:00:00.000Z',
      };
      const domainMsg = mapMessageRecordToDomain(msgRecord);
      expect(domainMsg.content).toBe('تسک جدید اضافه کن');
      expect(domainMsg.metadata).toEqual({ intent: 'create_task' });
    });
  });

  describe('Repository Mock Invocations', () => {
    it('executes TaskRepository CRUD methods with mocked database client', async () => {
      const mockDb: any = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({}),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue({}),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      };

      const repo = new SqliteTaskRepository(() => mockDb);
      const sampleTask = createTask({
        id: 'task-999',
        title: 'تسک تستی',
      });

      await repo.create(sampleTask);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);

      await repo.update(sampleTask);
      expect(mockDb.update).toHaveBeenCalledTimes(1);

      await repo.delete('task-999');
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
    });

    it('executes NoteRepository CRUD methods with mocked database client', async () => {
      const mockDb: any = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({}),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue({}),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      };

      const repo = new SqliteNoteRepository(() => mockDb);
      const sampleNote = createNote({
        id: 'note-999',
        title: 'یادداشت تستی',
        content: 'محتوا',
      });

      await repo.create(sampleNote);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);

      await repo.update(sampleNote);
      expect(mockDb.update).toHaveBeenCalledTimes(1);

      await repo.delete('note-999');
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
    });

    it('executes ConversationRepository CRUD methods with mocked database client', async () => {
      const mockDb: any = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockResolvedValue({}),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue({}),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      };

      const repo = new SqliteConversationRepository(() => mockDb);
      const sampleConv = createConversation({
        id: 'conv-test-1',
        title: 'گفتگو',
      });

      await repo.create(sampleConv);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);

      const sampleMsg = createMessage({
        id: 'msg-test-1',
        conversationId: 'conv-test-1',
        role: 'user',
        content: 'سلام',
      });

      await repo.addMessage(sampleMsg);
      expect(mockDb.insert).toHaveBeenCalledTimes(2);

      await repo.delete('conv-test-1');
      expect(mockDb.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Planner Store SQLite Initialization', () => {
    it('seeds and initializes store state correctly', async () => {
      const store = usePlannerStore.getState();
      expect(Array.isArray(store.tasks)).toBe(true);
      expect(Array.isArray(store.notes)).toBe(true);

      const initialTaskCount = store.tasks.length;
      const initialNoteCount = store.notes.length;

      // Mutating task creates task optimistically
      const created = store.addTask({
        title: 'تسک جدید برای تست استور',
        priority: 'high',
      });
      expect(created.title).toBe('تسک جدید برای تست استور');
      expect(usePlannerStore.getState().tasks.length).toBe(initialTaskCount + 1);
      expect(usePlannerStore.getState().tasks[0].id).toBe(created.id);

      // Mutating note creates note optimistically
      const createdNote = store.addNote({
        title: 'یادداشت جدید برای تست استور',
        content: 'توضیحات یادداشت',
      });
      expect(createdNote.title).toBe('یادداشت جدید برای تست استور');
      expect(usePlannerStore.getState().notes.length).toBe(initialNoteCount + 1);
      expect(usePlannerStore.getState().notes[0].id).toBe(createdNote.id);
    });
  });
});
