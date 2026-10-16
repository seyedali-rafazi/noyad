import { tasks } from './tasks';
import { notes } from './notes';
import { conversations } from './conversations';
import { messages } from './messages';
import { aiApiKeys } from './aiKeys';

export * from './tasks';
export * from './notes';
export * from './conversations';
export * from './messages';
export * from './aiKeys';

export const schema = {
  tasks,
  notes,
  conversations,
  messages,
  aiApiKeys,
};
