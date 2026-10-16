/**
 * Application Data Contracts & Types
 *
 * Mock data has been removed. Stores initialize with empty state for real user data.
 */

import { Task } from '../../domain/models/task';
import { Note } from '../../domain/models/note';
import { Message } from '../../domain/models/conversation';

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_NOTES: Note[] = [];

export interface ProposedActionPreview {
  type: 'create_task' | 'update_task' | 'delete_task';
  title: string;
  dueDateLabel?: string;
  priorityLabel?: string;
  isDestructive?: boolean;
}

export interface ChatMessageItem extends Message {
  proposedAction?: ProposedActionPreview;
}

export const INITIAL_MESSAGES: ChatMessageItem[] = [];

export const SUGGESTED_PROMPTS = [
  'کارهای امروزمو نشون بده',
  'برای فردا برنامه‌ریزی کن',
  'یه یادداشت جدید بساز',
  'کارهای عقب‌افتادهمو مرتب کن',
];
