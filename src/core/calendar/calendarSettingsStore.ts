import { create } from 'zustand';
import { settingsRepository } from '../database/repositories/settingsRepository';

export type WeekStartOption = 'saturday' | 'sunday' | 'monday';

const WEEK_START_STORAGE_KEY = 'calendar_week_start';

export function weekStartToDayIndex(weekStart: WeekStartOption): 0 | 1 | 6 {
  switch (weekStart) {
    case 'sunday':
      return 0;
    case 'monday':
      return 1;
    case 'saturday':
    default:
      return 6;
  }
}

interface CalendarSettingsState {
  weekStart: WeekStartOption;
  isInitialized: boolean;
  initializeCalendarSettings: () => Promise<void>;
  setWeekStart: (weekStart: WeekStartOption) => void;
}

export const useCalendarSettingsStore = create<CalendarSettingsState>((set) => ({
  weekStart: 'saturday',
  isInitialized: false,
  initializeCalendarSettings: async () => {
    const saved = await settingsRepository.get<WeekStartOption>(WEEK_START_STORAGE_KEY);
    if (saved === 'saturday' || saved === 'sunday' || saved === 'monday') {
      set({ weekStart: saved, isInitialized: true });
    } else {
      set({ isInitialized: true });
    }
  },
  setWeekStart: (weekStart) => {
    set({ weekStart });
    settingsRepository.set(WEEK_START_STORAGE_KEY, weekStart).catch(() => {});
  },
}));
