import { create } from 'zustand';
import { Task, createTask } from '../../domain/models/task';
import { Note, createNote } from '../../domain/models/note';
import { TaskPriority, TaskStatus } from '../../domain/types/common';
import { INITIAL_TASKS, INITIAL_NOTES } from '../../shared/preview/mockData';
import { isSameJalaliDay, isOverdue } from '../../core/calendar';

export type TaskFilter = 'today' | 'upcoming' | 'completed' | 'all';

interface PlannerState {
  tasks: Task[];
  notes: Note[];
  selectedDate: Date;
  taskFilter: TaskFilter;
  noteSearchQuery: string;

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

  setSelectedDate: (date) => set({ selectedDate: date }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  setNoteSearchQuery: (query) => set({ noteSearchQuery: query }),

  toggleTaskComplete: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== id) return task;
        const willBeCompleted = task.status !== 'completed';
        const nowIso = new Date().toISOString();
        return {
          ...task,
          status: (willBeCompleted ? 'completed' : 'pending') as TaskStatus,
          completedAt: willBeCompleted ? nowIso : null,
          updatedAt: nowIso,
        };
      }),
    })),

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

    set((state) => ({ tasks: [newTask, ...state.tasks] }));
    return newTask;
  },

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : task
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  addNote: (params) => {
    const id = `note-${Date.now()}`;
    const newNote = createNote({
      id,
      title: params.title,
      content: params.content,
      tags: params.tags ?? [],
      isPinned: params.isPinned ?? false,
    });

    set((state) => ({ notes: [newNote, ...state.notes] }));
    return newNote;
  },

  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : note
      ),
    })),

  deleteNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),

  togglePinNote: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
          : note
      ),
    })),

  getTasksForDate: (date: Date) => {
    const { tasks } = get();
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
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
          (t) => t.dueDate && isSameJalaliDay(new Date(t.dueDate), today)
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
