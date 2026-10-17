import { Platform } from 'react-native';
import { create } from 'zustand';
import { Task, createTask } from '../../domain/models/task';
import { Note, createNote } from '../../domain/models/note';
import { TaskPriority, TaskStatus } from '../../domain/types/common';
import { INITIAL_TASKS, INITIAL_NOTES } from '../../shared/preview/mockData';
import { isSameJalaliDay, isOverdue } from '../../core/calendar';
import { taskRepository, noteRepository } from '../../core/database/repositories';

const WEB_TASKS_KEY = 'ai_calender_tasks';
const WEB_NOTES_KEY = 'ai_calender_notes';

function savePlannerToWebStorage(tasks: readonly Task[], notes: readonly Note[]) {
  if (typeof window !== 'undefined' && window.localStorage) {
    setTimeout(() => {
      try {
        window.localStorage.setItem(WEB_TASKS_KEY, JSON.stringify(tasks));
        window.localStorage.setItem(WEB_NOTES_KEY, JSON.stringify(notes));
      } catch {}
    }, 0);
  }
}

function loadPlannerFromWebStorage(): { tasks: Task[] | null; notes: Note[] | null } {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const rawTasks = window.localStorage.getItem(WEB_TASKS_KEY);
      const rawNotes = window.localStorage.getItem(WEB_NOTES_KEY);
      return {
        tasks: rawTasks ? (JSON.parse(rawTasks) as Task[]) : null,
        notes: rawNotes ? (JSON.parse(rawNotes) as Note[]) : null,
      };
    } catch {
      return { tasks: null, notes: null };
    }
  }
  return { tasks: null, notes: null };
}

export type TaskFilter = 'today' | 'upcoming' | 'completed' | 'all';

interface PlannerState {
  tasks: Task[];
  notes: Note[];
  selectedDate: Date;
  taskFilter: TaskFilter;
  noteSearchQuery: string;
  isInitialized: boolean;
  isLoading: boolean;

  // Initialization
  initializeFromDatabase: () => Promise<void>;

  // Task actions
  setSelectedDate: (date: Date) => void;
  setTaskFilter: (filter: TaskFilter) => void;
  toggleTaskComplete: (id: string) => void;
  addTask: (params: {
    title: string;
    description?: string;
    dueDate?: string | null;
    isAllDay?: boolean;
    priority?: TaskPriority;
  }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Note actions
  setNoteSearchQuery: (query: string) => void;
  addNote: (params: {
    title: string;
    content: string;
    tags?: string[];
    isPinned?: boolean;
  }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;

  // Selectors / Helpers
  getTasksForDate: (date: Date) => Task[];
  getOverdueTasks: () => Task[];
  getFilteredTasks: () => Task[];
  getFilteredNotes: () => Note[];
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  tasks: INITIAL_TASKS,
  notes: INITIAL_NOTES,
  selectedDate: new Date(),
  taskFilter: 'today',
  noteSearchQuery: '',
  isInitialized: false,
  isLoading: false,

  initializeFromDatabase: async () => {
    // 1. Initial attempt from web storage
    const webData = loadPlannerFromWebStorage();
    if (webData.tasks || webData.notes) {
      set({
        tasks: webData.tasks || INITIAL_TASKS,
        notes: webData.notes || INITIAL_NOTES,
        isInitialized: true,
      });
    }

    try {
      set({ isLoading: true });
      const { tasks: dbTasks } = await taskRepository.findMany();
      const { notes: dbNotes } = await noteRepository.findMany();

      if (dbTasks.length === 0 && dbNotes.length === 0) {
        // First run: seed mock data if not in web storage
        if (!webData.tasks && !webData.notes) {
          for (const t of INITIAL_TASKS) {
            await taskRepository.create(t).catch(() => {});
          }
          for (const n of INITIAL_NOTES) {
            await noteRepository.create(n).catch(() => {});
          }
          set({
            tasks: [...INITIAL_TASKS],
            notes: [...INITIAL_NOTES],
            isInitialized: true,
            isLoading: false,
          });
          savePlannerToWebStorage(INITIAL_TASKS, INITIAL_NOTES);
        } else {
          set({ isLoading: false, isInitialized: true });
        }
      } else {
        set({
          tasks: [...dbTasks],
          notes: [...dbNotes],
          isInitialized: true,
          isLoading: false,
        });
        savePlannerToWebStorage(dbTasks, dbNotes);
      }
    } catch (err) {
      if (Platform.OS !== 'web') {
        console.warn('Failed to load from SQLite database, keeping memory/web state:', err);
      }
      set({ isInitialized: true, isLoading: false });
    }
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  setNoteSearchQuery: (query) => set({ noteSearchQuery: query }),

  toggleTaskComplete: (id) => {
    let targetTask: Task | null = null;
    set((state) => {
      const nextTasks = state.tasks.map((task) => {
        if (task.id !== id) return task;
        const willBeCompleted = task.status !== 'completed';
        const nowIso = new Date().toISOString();
        targetTask = {
          ...task,
          status: (willBeCompleted ? 'completed' : 'pending') as TaskStatus,
          completedAt: willBeCompleted ? nowIso : null,
          updatedAt: nowIso,
        };
        return targetTask;
      });
      savePlannerToWebStorage(nextTasks, state.notes);
      return { tasks: nextTasks };
    });

    if (targetTask) {
      taskRepository.update(targetTask).catch((err) => {
        if (Platform.OS !== 'web') {
          console.error('Failed to update task in SQLite:', err);
        }
      });
    }
  },

  addTask: (params) => {
    const id = `task-${Date.now()}`;
    const newTask = createTask({
      id,
      title: params.title,
      description: params.description ?? null,
      dueDate: params.dueDate ?? null,
      isAllDay: params.isAllDay ?? false,
      priority: params.priority ?? 'medium',
      status: 'pending',
    });

    set((state) => {
      const nextTasks = [newTask, ...state.tasks];
      savePlannerToWebStorage(nextTasks, state.notes);
      return { tasks: nextTasks };
    });

    taskRepository.create(newTask).catch((err) => {
      if (Platform.OS !== 'web') {
        console.error('Failed to persist new task in SQLite:', err);
      }
    });

    return newTask;
  },

  updateTask: (id, updates) => {
    let targetTask: Task | null = null;
    set((state) => {
      const nextTasks = state.tasks.map((task) => {
        if (task.id !== id) return task;
        targetTask = {
          ...task,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return targetTask;
      });
      savePlannerToWebStorage(nextTasks, state.notes);
      return { tasks: nextTasks };
    });

    if (targetTask) {
      taskRepository.update(targetTask).catch((err) => {
        if (Platform.OS !== 'web') {
          console.error('Failed to update task in SQLite:', err);
        }
      });
    }
  },

  deleteTask: (id) => {
    set((state) => {
      const nextTasks = state.tasks.filter((t) => t.id !== id);
      savePlannerToWebStorage(nextTasks, state.notes);
      return { tasks: nextTasks };
    });

    taskRepository.delete(id).catch((err) => {
      if (Platform.OS !== 'web') {
        console.error('Failed to delete task in SQLite:', err);
      }
    });
  },

  addNote: (params) => {
    const id = `note-${Date.now()}`;
    const newNote = createNote({
      id,
      title: params.title,
      content: params.content,
      tags: params.tags ?? [],
      isPinned: params.isPinned ?? false,
    });

    set((state) => {
      const nextNotes = [newNote, ...state.notes];
      savePlannerToWebStorage(state.tasks, nextNotes);
      return { notes: nextNotes };
    });

    noteRepository.create(newNote).catch((err) => {
      if (Platform.OS !== 'web') {
        console.error('Failed to persist new note in SQLite:', err);
      }
    });

    return newNote;
  },

  updateNote: (id, updates) => {
    let targetNote: Note | null = null;
    set((state) => {
      const nextNotes = state.notes.map((note) => {
        if (note.id !== id) return note;
        targetNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return targetNote;
      });
      savePlannerToWebStorage(state.tasks, nextNotes);
      return { notes: nextNotes };
    });

    if (targetNote) {
      noteRepository.update(targetNote).catch((err) => {
        if (Platform.OS !== 'web') {
          console.error('Failed to update note in SQLite:', err);
        }
      });
    }
  },

  deleteNote: (id) => {
    set((state) => {
      const nextNotes = state.notes.filter((n) => n.id !== id);
      savePlannerToWebStorage(state.tasks, nextNotes);
      return { notes: nextNotes };
    });

    noteRepository.delete(id).catch((err) => {
      if (Platform.OS !== 'web') {
        console.error('Failed to delete note in SQLite:', err);
      }
    });
  },

  togglePinNote: (id) => {
    let targetNote: Note | null = null;
    set((state) => {
      const nextNotes = state.notes.map((note) => {
        if (note.id !== id) return note;
        targetNote = {
          ...note,
          isPinned: !note.isPinned,
          updatedAt: new Date().toISOString(),
        };
        return targetNote;
      });
      savePlannerToWebStorage(state.tasks, nextNotes);
      return { notes: nextNotes };
    });

    if (targetNote) {
      noteRepository.update(targetNote).catch((err) => {
        if (Platform.OS !== 'web') {
          console.error('Failed to update pin status in SQLite:', err);
        }
      });
    }
  },

  getTasksForDate: (date: Date) => {
    const { tasks } = get();
    const isDateToday = isSameJalaliDay(date, new Date());
    return tasks.filter((t) => {
      if (!t.dueDate) return isDateToday;
      return isSameJalaliDay(new Date(t.dueDate), date);
    });
  },

  getOverdueTasks: () => {
    const { tasks } = get();
    const today = new Date();
    return tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      return isOverdue(t.dueDate, today);
    });
  },

  getFilteredTasks: () => {
    const { tasks, taskFilter } = get();
    const today = new Date();

    switch (taskFilter) {
      case 'today':
        return tasks.filter(
          (t) => !t.dueDate || isSameJalaliDay(new Date(t.dueDate), today)
        );
      case 'upcoming':
        return tasks.filter((t) => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due > today && !isSameJalaliDay(due, today);
        });
      case 'completed':
        return tasks.filter((t) => t.status === 'completed');
      case 'all':
      default:
        return tasks;
    }
  },

  getFilteredNotes: () => {
    const { notes, noteSearchQuery } = get();
    const query = noteSearchQuery.trim().toLowerCase();

    const filtered = notes.filter((n) => {
      if (!query) return true;
      return (
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    // Pinned notes on top, then by updatedAt descending
    return filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },
}));
