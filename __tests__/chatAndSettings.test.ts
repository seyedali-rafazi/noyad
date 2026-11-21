import { extractActionFromText } from '../src/core/ai/aiUtils';
import { getPersianWeekdayNamesShort, getJalaliMonthGrid } from '../src/core/calendar';
import { usePlannerStore } from '../src/features/planner/plannerStore';
import { useChatStore } from '../src/features/chat/chatStore';

describe('Calendar Week Start & AI Actions Integration', () => {
  beforeEach(() => {
    usePlannerStore.setState({ tasks: [], notes: [] });
    useChatStore.setState({ messages: [], activeConfirmation: null, isTyping: false });
  });

  it('rotates Persian weekday headers properly for Saturday, Sunday, and Monday starts', () => {
    const sat = getPersianWeekdayNamesShort(6);
    expect(sat[0].label).toBe('ش');
    expect(sat[6].label).toBe('ج');
    expect(sat[6].isFriday).toBe(true);

    const sun = getPersianWeekdayNamesShort(0);
    expect(sun[0].label).toBe('۱ش');
    expect(sun[5].isFriday).toBe(true);
    expect(sun[6].label).toBe('ش');

    const mon = getPersianWeekdayNamesShort(1);
    expect(mon[0].label).toBe('۲ش');
    expect(mon[4].isFriday).toBe(true);
    expect(mon[6].label).toBe('۱ش');
  });

  it('generates a valid 7-column month grid for custom weekStartsOn', () => {
    const grid = getJalaliMonthGrid(new Date('2026-04-15T12:00:00Z'), undefined, 1);
    expect(grid.length % 7).toBe(0);
    // Monday is JS day 1
    expect(grid[0].date.getDay()).toBe(1);
  });

  it('extracts create_note, complete_task, delete_task, and delete_note actions from AI text', () => {
    const noteRes = extractActionFromText(
      'یادداشت را آماده کردم:\n```json\n{"action":"create_note","title":"ایده محصول","content":"پشتیبانی از تقویم جلالی","tags":["محصول"]}\n```'
    );
    expect(noteRes.proposedAction?.type).toBe('create_note');
    expect(noteRes.proposedAction?.title).toBe('ایده محصول');
    expect(noteRes.proposedAction?.content).toBe('پشتیبانی از تقویم جلالی');
    expect(noteRes.proposedAction?.isDestructive).toBe(false);

    const deleteTaskRes = extractActionFromText(
      'آیا حذف کنم؟\n```json\n{"action":"delete_task","title":"جلسه صبح"}\n```'
    );
    expect(deleteTaskRes.proposedAction?.type).toBe('delete_task');
    expect(deleteTaskRes.proposedAction?.isDestructive).toBe(true);

    const completeRes = extractActionFromText(
      'تکمیل کنم؟\n```json\n{"action":"complete_task","title":"ارسال گزارش"}\n```'
    );
    expect(completeRes.proposedAction?.type).toBe('complete_task');
    expect(completeRes.proposedAction?.isDestructive).toBe(false);

    const deleteNoteRes = extractActionFromText(
      'حذف یادداشت:\n```json\n{"action":"delete_note","title":"ایده محصول"}\n```'
    );
    expect(deleteNoteRes.proposedAction?.type).toBe('delete_note');
    expect(deleteNoteRes.proposedAction?.isDestructive).toBe(true);
  });

  it('executes create_note, complete_task, and confirmed delete_task/delete_note in chatStore', () => {
    // 1. Create a task via AI action
    useChatStore.getState().confirmAction({
      type: 'create_task',
      title: 'ارسال گزارش ماهانه',
      priority: 'high',
      dueDate: new Date().toISOString(),
    });
    expect(usePlannerStore.getState().tasks).toHaveLength(1);
    const createdTask = usePlannerStore.getState().tasks[0];

    // 2. Complete the task via AI action
    useChatStore.getState().confirmAction({
      type: 'complete_task',
      targetId: createdTask.id,
      title: createdTask.title,
    });
    expect(usePlannerStore.getState().tasks[0].status).toBe('completed');

    // 3. Delete the task via AI action (must gate behind confirmation)
    useChatStore.getState().confirmAction({
      type: 'delete_task',
      targetId: createdTask.id,
      title: createdTask.title,
      isDestructive: true,
    });
    expect(usePlannerStore.getState().tasks).toHaveLength(1);
    const taskConfirm = useChatStore.getState().activeConfirmation;
    expect(taskConfirm).not.toBeNull();
    expect(taskConfirm?.actionType).toBe('delete_task');

    taskConfirm?.onConfirm();
    expect(usePlannerStore.getState().tasks).toHaveLength(0);

    // 4. Create & delete a note via AI action
    useChatStore.getState().confirmAction({
      type: 'create_note',
      title: 'صورت‌جلسه',
      content: 'تصمیمات کلیدی جلسه',
      tags: ['کار'],
    });
    expect(usePlannerStore.getState().notes).toHaveLength(1);
    const createdNote = usePlannerStore.getState().notes[0];

    useChatStore.getState().confirmAction({
      type: 'delete_note',
      targetId: createdNote.id,
      title: createdNote.title,
      isDestructive: true,
    });
    const noteConfirm = useChatStore.getState().activeConfirmation;
    expect(noteConfirm?.actionType).toBe('delete_note');
    noteConfirm?.onConfirm();
    expect(usePlannerStore.getState().notes).toHaveLength(0);
  });
});
