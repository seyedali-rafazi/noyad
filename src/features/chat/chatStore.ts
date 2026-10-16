import { create } from 'zustand';
import {
  INITIAL_MESSAGES,
  ChatMessageItem,
  ProposedActionPreview,
} from '../../shared/preview/mockData';
import { usePlannerStore } from '../planner/plannerStore';

interface ChatState {
  messages: ChatMessageItem[];
  isTyping: boolean;
  activeConfirmation: {
    visible: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null;

  sendMessage: (content: string) => void;
  confirmAction: (action: ProposedActionPreview) => void;
  dismissConfirmation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isTyping: false,
  activeConfirmation: null,

  dismissConfirmation: () => set({ activeConfirmation: null }),

  confirmAction: (action) => {
    // If destructive, trigger confirmation dialog
    if (action.isDestructive) {
      set({
        activeConfirmation: {
          visible: true,
          title: 'تایید عملیات حساس',
          description: `آیا از حذف «${action.title}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`,
          onConfirm: () => {
            set({ activeConfirmation: null });
            const confirmMsg: ChatMessageItem = {
              id: `msg-${Date.now()}`,
              conversationId: 'conv-default',
              role: 'assistant',
              content: `عملیات «${action.title}» با موفقیت انجام شد.`,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({ messages: [...state.messages, confirmMsg] }));
          },
        },
      });
      return;
    }

    // Apply real action to Planner Store
    if (action.type === 'create_task') {
      usePlannerStore.getState().addTask({
        title: action.title,
        priority: 'medium',
      });
    }

    // Standard constructive action confirmation
    const successMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      conversationId: 'conv-default',
      role: 'assistant',
      content: `اقدام «${action.title}» با موفقیت به برنامه شما افزوده شد.`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, successMsg] }));
  },

  sendMessage: (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessageItem = {
      id: `msg-user-${Date.now()}`,
      conversationId: 'conv-default',
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isTyping: true,
    }));

    // Generate response using actual planner store state
    setTimeout(() => {
      let replyContent = '';
      let proposedAction: ProposedActionPreview | undefined = undefined;

      const lower = trimmed.toLowerCase();
      const plannerStore = usePlannerStore.getState();
      const todayTasks = plannerStore.getTasksForDate(new Date());
      const overdueTasks = plannerStore.getOverdueTasks();

      if (lower.includes('امروز') || lower.includes('کارها')) {
        if (todayTasks.length === 0) {
          replyContent =
            'در حال حاضر هیچ کاری برای امروز ثبت نشده است.\n\n' +
            'می‌توانید کارهای جدید خود را اضافه کنید تا من در برنامه‌ریزی به شما کمک کنم.';
        } else {
          const list = todayTasks
            .map(
              (t) =>
                `• ${t.title} (${
                  t.status === 'completed' ? 'تکمیل شده ✓' : 'در انتظار'
                })`
            )
            .join('\n');
          replyContent = `برنامه امروز شما شامل این موارد است:\n${list}\n\nآیا مایلید کار جدیدی اضافه کنید؟`;
        }
      } else if (lower.includes('فردا') || lower.includes('برنامه‌ریزی')) {
        replyContent =
          'برای فردا برنامه‌ای در نظر دارید؟\n' +
          'می‌توانم یک تسک جدید برای شروع روز فردا ثبت کنم:';
        proposedAction = {
          type: 'create_task',
          title: 'بررسی کارها و اولویت‌بندی روزانه',
          dueDateLabel: 'فردا ۱۰:۰۰',
          priorityLabel: 'متوسط',
          isDestructive: false,
        };
      } else if (lower.includes('یادداشت')) {
        replyContent =
          'می‌توانید از بخش یادداشت‌ها یادداشت‌های خود را مدیریت کنید یا بگویید چه موردی را می‌خواهید ثبت کنید.';
      } else if (lower.includes('عقب') || lower.includes('عقب‌افتاده') || lower.includes('مرتب')) {
        if (overdueTasks.length === 0) {
          replyContent = 'عالی است! شما هیچ کار عقب‌افتاده‌ای ندارید.';
        } else {
          const list = overdueTasks.map((t) => `• ${t.title}`).join('\n');
          replyContent = `کارهای عقب‌افتاده شما:\n${list}\n\nپیشنهاد می‌کنم آن‌ها را تعیین تکلیف کنید.`;
        }
      } else {
        replyContent =
          `پیام شما دریافت شد: «${trimmed}»\n\n` +
          'من دستیار مدیریت زمان شما هستم. می‌توانید درباره کارهای امروز، تقویم و برنامه‌ریزی با من گفتگو کنید.';
      }

      const assistantMessage: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        conversationId: 'conv-default',
        role: 'assistant',
        content: replyContent,
        createdAt: new Date().toISOString(),
        proposedAction,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isTyping: false,
      }));
    }, 600);
  },
}));
