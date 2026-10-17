import { create } from 'zustand';
import {
  INITIAL_MESSAGES,
  ChatMessageItem,
  ProposedActionPreview,
} from '../../shared/preview/mockData';
import { usePlannerStore } from '../planner/plannerStore';
import { aiClient } from '../../core/ai/aiClient';
import { TaskPriority } from '../../domain/types/common';

import { resolveDueDateIso } from '../../core/ai/aiUtils';

interface ChatState {
  messages: ChatMessageItem[];
  isTyping: boolean;
  activeConfirmation: {
    visible: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null;

  sendMessage: (content: string) => Promise<void>;
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

    // Apply real action to Planner Store & SQLite persistence
    const actionType: string = String(action.type || (action as any).action || '').toLowerCase();
    const isTaskOrMeeting =
      actionType === 'create_task' ||
      actionType === 'add_task' ||
      actionType === 'new_task' ||
      actionType === 'create_event' ||
      actionType === 'add_event' ||
      actionType === 'new_event' ||
      actionType === 'create_meeting' ||
      actionType === 'add_meeting' ||
      actionType === 'new_meeting' ||
      actionType === 'set_meeting' ||
      actionType === 'schedule_meeting' ||
      actionType === 'meeting' ||
      actionType === 'event';

    if (isTaskOrMeeting) {
      const dueDateIso = resolveDueDateIso(action.dueDate, action.dueDateLabel);

      const priority: TaskPriority =
        action.priority ||
        (action.priorityLabel === 'فوری'
          ? 'urgent'
          : action.priorityLabel === 'بالا' || action.priorityLabel === 'زیاد'
          ? 'high'
          : action.priorityLabel === 'کم' || action.priorityLabel === 'پایین'
          ? 'low'
          : 'medium');

      usePlannerStore.getState().addTask({
        title: action.title,
        dueDate: dueDateIso,
        priority,
      });

      // Synchronize planner's selectedDate so the newly created meeting/task is selected immediately
      if (dueDateIso) {
        usePlannerStore.getState().setSelectedDate(new Date(dueDateIso));
      }
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

  sendMessage: async (content: string) => {
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

    try {
      const history = get().messages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const aiResponse = await aiClient.generateResponse(trimmed, history);

      const assistantMessage: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        conversationId: 'conv-default',
        role: 'assistant',
        content: aiResponse.reply,
        createdAt: new Date().toISOString(),
        proposedAction: aiResponse.proposedAction,
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isTyping: false,
      }));
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        conversationId: 'conv-default',
        role: 'assistant',
        content: 'متأسفانه در برقراری ارتباط خطایی رخ داد. لطفاً مجدداً تلاش فرمایید.',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, fallbackMsg],
        isTyping: false,
      }));
    }
  },
}));
