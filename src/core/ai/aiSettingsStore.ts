import { Platform } from 'react-native';
import { create } from 'zustand';
import { eq, asc } from 'drizzle-orm';
import { getDatabase, isDatabaseSupported } from '../database/client';
import { aiApiKeys } from '../database/schema/aiKeys';

export const GROQ_MODEL_ID = 'openai/gpt-oss-20b';
export const GROQ_MODEL_NAME = 'GPT 20B';

export interface StoredApiKey {
  id: string;
  provider: string;
  apiKey: string;
  label?: string | null;
  status: 'active' | 'exhausted' | 'invalid';
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AiSettingsState {
  keys: StoredApiKey[];
  selectedModel: string;
  isLoading: boolean;
  isInitialized: boolean;

  loadKeys: () => Promise<void>;
  addKey: (apiKey: string, label?: string) => Promise<boolean>;
  removeKey: (id: string) => Promise<void>;
  markKeyExhausted: (apiKey: string) => Promise<void>;
  markKeyInvalid: (apiKey: string) => Promise<void>;
  resetKeyStatuses: () => Promise<void>;
  getActiveKeys: () => StoredApiKey[];
  setSelectedModel: (model: string) => void;
}

const WEB_KEYS_STORAGE_KEY = 'ai_calender_groq_keys';
const WEB_LEGACY_KEYS_KEY = 'ai_calender_ai_keys';
const WEB_MODEL_STORAGE_KEY = 'ai_calender_selected_model';

function saveToWebStorage(keys: StoredApiKey[], model?: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(WEB_KEYS_STORAGE_KEY, JSON.stringify(keys));
      if (model) {
        window.localStorage.setItem(WEB_MODEL_STORAGE_KEY, model);
      }
    } catch {
      // Ignore quota
    }
  }
}

function loadFromWebStorage(): {
  keys: StoredApiKey[] | null;
  model: string | null;
} {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw =
        window.localStorage.getItem(WEB_KEYS_STORAGE_KEY) ||
        window.localStorage.getItem(WEB_LEGACY_KEYS_KEY);
      const model = window.localStorage.getItem(WEB_MODEL_STORAGE_KEY);
      const keys = raw ? (JSON.parse(raw) as StoredApiKey[]) : null;
      return { keys, model };
    } catch {
      return { keys: null, model: null };
    }
  }
  return { keys: null, model: null };
}

export const useAiSettingsStore = create<AiSettingsState>((set, get) => ({
  keys: [],
  selectedModel: GROQ_MODEL_ID,
  isLoading: false,
  isInitialized: false,

  loadKeys: async () => {
    // 1. Initial attempt from web storage
    const webData = loadFromWebStorage();
    if (webData.keys && Array.isArray(webData.keys)) {
      set({
        keys: webData.keys.map((k) => ({
          ...k,
          provider: 'groq',
        })),
        selectedModel: GROQ_MODEL_ID,
        isInitialized: true,
      });
    }

    if (!isDatabaseSupported()) {
      set({ isLoading: false, isInitialized: true });
      return;
    }

    try {
      set({ isLoading: true });
      const db = getDatabase();
      const rows = await db
        .select()
        .from(aiApiKeys)
        .orderBy(asc(aiApiKeys.createdAt));

      if (rows && rows.length > 0) {
        const mapped: StoredApiKey[] = rows.map((r) => ({
          ...r,
          provider: 'groq',
          label: r.label ?? null,
        }));
        set({
          keys: mapped,
          selectedModel: GROQ_MODEL_ID,
          isLoading: false,
          isInitialized: true,
        });
        saveToWebStorage(mapped, GROQ_MODEL_ID);
      } else {
        set({ isLoading: false, isInitialized: true });
      }
    } catch (err) {
      if (Platform.OS !== 'web') {
        console.warn('Failed to load Groq keys from SQLite:', err);
      }
      set({ isLoading: false, isInitialized: true });
    }
  },

  addKey: async (rawApiKey: string, label?: string) => {
    const trimmed = rawApiKey.trim();
    if (!trimmed) return false;

    // Avoid duplicate keys
    const existing = get().keys.find((k) => k.apiKey === trimmed);
    if (existing) {
      return false;
    }

    const now = new Date().toISOString();
    const newEntry: StoredApiKey = {
      id: `key-${Date.now()}`,
      provider: 'groq',
      apiKey: trimmed,
      label: label ? label.trim() : null,
      status: 'active',
      failureCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const nextKeys = [...get().keys, newEntry];
    set({ keys: nextKeys });
    saveToWebStorage(nextKeys, get().selectedModel);

    if (isDatabaseSupported()) {
      try {
        const db = getDatabase();
        await db.insert(aiApiKeys).values(newEntry);
      } catch (err) {
        if (Platform.OS !== 'web') {
          console.warn('Failed to persist Groq key to SQLite:', err);
        }
      }
    }

    return true;
  },

  removeKey: async (id: string) => {
    const nextKeys = get().keys.filter((k) => k.id !== id);
    set({ keys: nextKeys });
    saveToWebStorage(nextKeys, get().selectedModel);

    if (isDatabaseSupported()) {
      try {
        const db = getDatabase();
        await db.delete(aiApiKeys).where(eq(aiApiKeys.id, id));
      } catch (err) {
        if (Platform.OS !== 'web') {
          console.warn('Failed to delete Groq key from SQLite:', err);
        }
      }
    }
  },

  markKeyExhausted: async (apiKey: string) => {
    const now = new Date().toISOString();
    const nextKeys = get().keys.map((k) =>
      k.apiKey === apiKey
        ? { ...k, status: 'exhausted' as const, failureCount: k.failureCount + 1, updatedAt: now }
        : k
    );
    set({ keys: nextKeys });
    saveToWebStorage(nextKeys, get().selectedModel);

    if (isDatabaseSupported()) {
      try {
        const db = getDatabase();
        await db
          .update(aiApiKeys)
          .set({ status: 'exhausted', updatedAt: now })
          .where(eq(aiApiKeys.apiKey, apiKey));
      } catch (err) {
        if (Platform.OS !== 'web') {
          console.warn('Failed to update Groq key status in SQLite:', err);
        }
      }
    }
  },

  markKeyInvalid: async (apiKey: string) => {
    const now = new Date().toISOString();
    const nextKeys = get().keys.map((k) =>
      k.apiKey === apiKey
        ? { ...k, status: 'invalid' as const, failureCount: k.failureCount + 1, updatedAt: now }
        : k
    );
    set({ keys: nextKeys });
    saveToWebStorage(nextKeys, get().selectedModel);

    if (isDatabaseSupported()) {
      try {
        const db = getDatabase();
        await db
          .update(aiApiKeys)
          .set({ status: 'invalid', updatedAt: now })
          .where(eq(aiApiKeys.apiKey, apiKey));
      } catch (err) {
        if (Platform.OS !== 'web') {
          console.warn('Failed to update Groq key status in SQLite:', err);
        }
      }
    }
  },

  resetKeyStatuses: async () => {
    const now = new Date().toISOString();
    const nextKeys = get().keys.map((k) => ({
      ...k,
      status: 'active' as const,
      failureCount: 0,
      updatedAt: now,
    }));
    set({ keys: nextKeys });
    saveToWebStorage(nextKeys, get().selectedModel);

    if (isDatabaseSupported()) {
      try {
        const db = getDatabase();
        await db
          .update(aiApiKeys)
          .set({ status: 'active', failureCount: 0, updatedAt: now });
      } catch (err) {
        if (Platform.OS !== 'web') {
          console.warn('Failed to reset Groq key statuses in SQLite:', err);
        }
      }
    }
  },

  getActiveKeys: () => {
    return get().keys.filter((k) => k.status === 'active');
  },

  setSelectedModel: (model: string) => {
    set({ selectedModel: model });
    saveToWebStorage(get().keys, model);
  },
}));
