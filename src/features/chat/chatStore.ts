import { Platform } from 'react-native';
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
import { conversationRepository } from '../../core/database/repositories/conversationRepository';
import { isDatabaseSupported } from '../../core/database/client';
import { createConversation, createMessage } from '../../domain/models/conversation';
import { Task } from '../../domain/models/task';
import { Note } from '../../domain/models/note';

const DEFAULT_CONVERSATION_ID = 'conv-default';
const WEB_CHAT_STORAGE_KEY = 'noyad_chat_messages';

function saveMessagesToWebStorage(messages: readonly ChatMessageItem[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(WEB_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage quota errors
    }
  }
}

function loadMessagesFromWebStorage(): ChatMessageItem[] | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(WEB_CHAT_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as ChatMessageItem[];
      }
    } catch {
      // Ignore parse errors
    }
  }
  return null;
}

async function ensureDefaultConversation(): Promise<void> {
  if (!isDatabaseSupported()) return;
  try {
    const existing = await conversationRepository.findById(DEFAULT_CONVERSATION_ID);
    if (!existing) {
      const now = new Date().toISOString();
      await conversationRepository.create(
        createConversation({
          id: DEFAULT_CONVERSATION_ID,
          title: 'گفتگوی اصلی نویاد',
          createdAt: now,
          updatedAt: now,
        })
      );
    }
  } catch {
    // Ignore when DB is unavailable
  }
}

async function persistMessage(item: ChatMessageItem): Promise<void> {
  if (!isDatabaseSupported()) return;
  try {
    await ensureDefaultConversation();
    const metadata: Record<string, unknown> | undefined = item.proposedAction
      ? { proposedAction: item.proposedAction }
      : item.metadata;

    await conversationRepository.addMessage(
      createMessage({
        id: item.id,
        conversationId: item.conversationId,
        role: item.role,
        content: item.content,
        metadata,
        createdAt: item.createdAt,
      })
    );
  } catch (err) {
    if (Platform.OS !== 'web') {
      console.warn('Failed to persist chat message to SQLite:', err);
    }
  }
}

function findMatchingTask(tasks: readonly Task[], action: ProposedActionPreview): Task | undefined {
  if (action.targetId) {
    const byId = tasks.find((t) => t.id === action.targetId);
    if (byId) return byId;
  }
  const normalizedTarget = action.title.trim().toLowerCase();
  if (!normalizedTarget) return undefined;

  return (
    tasks.find((t) => t.title.trim().toLowerCase() === normalizedTarget) ??
    tasks.find((t) => t.title.trim().toLowerCase().includes(normalizedTarget)) ??
    tasks.find((t) => normalizedTarget.includes(t.title.trim().toLowerCase()))
  );
}

function findMatchingNote(notes: readonly Note[], action: ProposedActionPreview): Note | undefined {
  if (action.targetId) {
    const byId = notes.find((n) => n.id === action.targetId);
    if (byId) return byId;
  }
  const normalizedTarget = action.title.trim().toLowerCase();
  if (!normalizedTarget) return undefined;

  return (
    notes.find((n) => n.title.trim().toLowerCase() === normalizedTarget) ??
    notes.find((n) => n.title.trim().toLowerCase().includes(normalizedTarget)) ??
    notes.find((n) => normalizedTarget.includes(n.title.trim().toLowerCase()))
  );
}

interface ChatState {
  messages: ChatMessageItem[];
  isTyping: boolean;
  isInitialized: boolean;
  activeConfirmation: {
    visible: boolean;
    actionType: 'delete_task' | 'delete_note';
    targetId: string;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null;

  initializeFromDatabase: () => Promise<void>;
  clearChat: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  confirmAction: (action: ProposedActionPreview) => void;
  dismissConfirmation: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isTyping: false,
  isInitialized: false,
  activeConfirmation: null,

  initializeFromDatabase: async () => {
    const webMessages = loadMessagesFromWebStorage();
    if (webMessages && webMessages.length > 0) {
      set({ messages: webMessages, isInitialized: true });
    }

    if (!isDatabaseSupported()) {
      set({ isInitialized: true });
      return;
    }

    try {
      await ensureDefaultConversation();
      const dbMessages = await conversationRepository.getMessages(DEFAULT_CONVERSATION_ID);
      if (dbMessages.length > 0) {
        const mapped: ChatMessageItem[] = dbMessages.map((m) => ({
          ...m,
          proposedAction: (m.metadata?.proposedAction as ProposedActionPreview | undefined) ?? undefined,
        }));
        set({ messages: mapped, isInitialized: true });
        saveMessagesToWebStorage(mapped);
      } else {
        set({ isInitialized: true });
      }
    } catch (err) {
      if (Platform.OS !== 'web') {
        console.warn('Failed to load chat history from SQLite:', err);
      }
      set({ isInitialized: true });
    }
  },

  clearChat: async () => {
    set({ messages: [], activeConfirmation: null });
    saveMessagesToWebStorage([]);

    if (isDatabaseSupported()) {
      try {
        await conversationRepository.delete(DEFAULT_CONVERSATION_ID);
        await ensureDefaultConversation();
      } catch {
        // Ignore
      }
    }
  },

  dismissConfirmation: () => set({ activeConfirmation: null }),

  confirmAction: (action) => {
    const appendAssistantFeedback = (content: string) => {
      const msg: ChatMessageItem = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        conversationId: DEFAULT_CONVERSATION_ID,
        role: 'assistant',
        content,
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const updated = [...state.messages, msg];
        saveMessagesToWebStorage(updated);
        return { messages: updated };
      });
      persistMessage(msg).catch(() => {});
    };

    const actionType = String(action.type || '').toLowerCase();

    // 1. Destructive actions require explicit confirmation modal
    if (actionType === 'delete_task' || actionType === 'delete_note' || action.isDestructive) {
      const isNoteDelete = actionType === 'delete_note';
      set({
        activeConfirmation: {
          visible: true,
          actionType: isNoteDelete ? 'delete_note' : 'delete_task',
          targetId: action.targetId ?? 'chat-target',
          title: isNoteDelete ? 'تایید حذف یادداشت' : 'تایید حذف تسک',
          description: `آیا از حذف «${action.title}» اطمینان دارید؟ این عملیات قابل بازگشت نیست.`,
          onConfirm: () => {
            set({ activeConfirmation: null });
            const planner = usePlannerStore.getState();

            if (isNoteDelete) {
              const targetNote = findMatchingNote(planner.notes, action);
              if (targetNote) {
                planner.deleteNote(targetNote.id);
                appendAssistantFeedback(`یادداشت «${targetNote.title}» با موفقیت حذف شد.`);
              } else {
                appendAssistantFeedback(`یادداشتی با عنوان «${action.title}» یافت نشد.`);
              }
            } else {
              const targetTask = findMatchingTask(planner.tasks, action);
              if (targetTask) {
                planner.deleteTask(targetTask.id);
                appendAssistantFeedback(`تسک «${targetTask.title}» با موفقیت حذف شد.`);
              } else {
                appendAssistantFeedback(`تسکی با عنوان «${action.title}» یافت نشد.`);
              }
            }
          },
        },
      });
      return;
    }

    const planner = usePlannerStore.getState();

    // 2. Complete task
    if (actionType === 'complete_task') {
      const targetTask = findMatchingTask(planner.tasks, action);
      if (targetTask) {
        if (targetTask.status !== 'completed') {
          planner.toggleTaskComplete(targetTask.id);
        }
        appendAssistantFeedback(`تسک «${targetTask.title}» به عنوان انجام‌شده علامت‌گذاری شد.`);
      } else {
        appendAssistantFeedback(`تسکی با عنوان «${action.title}» برای تکمیل یافت نشد.`);
      }
      return;
    }

    // 3. Update task
    if (actionType === 'update_task') {
      const targetTask = findMatchingTask(planner.tasks, action);
      if (targetTask) {
        const updates: Partial<Task> = {
          ...(action.title && action.title !== 'ویرایش تسک' ? { title: action.title } : {}),
          ...(action.description !== undefined ? { description: action.description } : {}),
          ...(action.priority ? { priority: action.priority } : {}),
          ...(action.dueDate ? { dueDate: action.dueDate } : {}),
        };

        planner.updateTask(targetTask.id, updates);
        appendAssistantFeedback(`تسک «${updates.title ?? targetTask.title}» با موفقیت به‌روزرسانی شد.`);
      } else {
        appendAssistantFeedback(`تسکی با عنوان «${action.title}» برای ویرایش یافت نشد.`);
      }
      return;
    }

    // 4. Create note
    if (actionType === 'create_note') {
      planner.addNote({
        title: action.title || 'یادداشت جدید',
        content: action.content ?? action.description ?? '',
        tags: action.tags ?? [],
      });
      appendAssistantFeedback(`یادداشت «${action.title}» با موفقیت ذخیره شد.`);
      return;
    }

    // 5. Update note
    if (actionType === 'update_note') {
      const targetNote = findMatchingNote(planner.notes, action);
      if (targetNote) {
        const updates: Partial<Note> = {
          ...(action.title && action.title !== 'ویرایش یادداشت' ? { title: action.title } : {}),
          ...(action.content !== undefined ? { content: action.content } : {}),
          ...(action.tags !== undefined ? { tags: action.tags } : {}),
        };

        planner.updateNote(targetNote.id, updates);
        appendAssistantFeedback(`یادداشت «${updates.title ?? targetNote.title}» با موفقیت ویرایش شد.`);
      } else {
        appendAssistantFeedback(`یادداشتی با عنوان «${action.title}» برای ویرایش یافت نشد.`);
      }
      return;
    }

    // 6. Create task / meeting / event (default constructive action)
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

    planner.addTask({
      title: action.title,
      description: action.description,
      dueDate: dueDateIso,
      priority,
    });

    if (dueDateIso) {
      planner.setSelectedDate(new Date(dueDateIso));
    }

    appendAssistantFeedback(`اقدام «${action.title}» با موفقیت به برنامه شما افزوده شد.`);
  },

  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: ChatMessageItem = {
      id: `msg-user-${Date.now()}`,
      conversationId: DEFAULT_CONVERSATION_ID,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.messages, userMessage];
      saveMessagesToWebStorage(updated);
      return {
        messages: updated,
        isTyping: true,
      };
    });
    persistMessage(userMessage).catch(() => {});

    try {
      const history = get().messages.map((m) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      }));

      const aiResponse = await aiClient.generateResponse(trimmed, history);

      const assistantMessage: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        conversationId: DEFAULT_CONVERSATION_ID,
        role: 'assistant',
        content: aiResponse.reply,
        createdAt: new Date().toISOString(),
        proposedAction: aiResponse.proposedAction,
      };

      set((state) => {
        const updated = [...state.messages, assistantMessage];
        saveMessagesToWebStorage(updated);
        return {
          messages: updated,
          isTyping: false,
        };
      });
      persistMessage(assistantMessage).catch(() => {});
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessageItem = {
        id: `msg-ai-${Date.now()}`,
        conversationId: DEFAULT_CONVERSATION_ID,
        role: 'assistant',
        content: 'متأسفانه در برقراری ارتباط خطایی رخ داد. لطفاً مجدداً تلاش فرمایید.',
        createdAt: new Date().toISOString(),
      };
      set((state) => {
        const updated = [...state.messages, fallbackMsg];
        saveMessagesToWebStorage(updated);
        return {
          messages: updated,
          isTyping: false,
        };
      });
      persistMessage(fallbackMsg).catch(() => {});
    }
  },
}));
