import { create } from "zustand";

const RESTORE_LAST_PAGE_KEY = "voton-restore-last-page";
const LAST_PAGE_ID_KEY = "voton-last-page-id";

function readPreference(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error("Failed to load workspace preference:", error);
    return null;
  }
}

function writePreference(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error("Failed to save workspace preference:", error);
  }
}

interface SettingsStore {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  restoreLastPage: boolean;
  lastPageId: string | null;
  preferencesLoaded: boolean;
  loadPreferences: () => void;
  setRestoreLastPage: (value: boolean) => void;
  rememberPage: (id: string) => void;
  clearLastPage: () => void;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  restoreLastPage: true,
  lastPageId: null,
  preferencesLoaded: false,
  // Called from the workspace's client effect, never during server rendering.
  loadPreferences: () => {
    if (get().preferencesLoaded) return;
    const restoreLastPage = readPreference(RESTORE_LAST_PAGE_KEY) !== "false";
    set({
      restoreLastPage,
      lastPageId: restoreLastPage ? readPreference(LAST_PAGE_ID_KEY) || null : null,
      preferencesLoaded: true,
    });
  },
  setRestoreLastPage: (value) => {
    set({ restoreLastPage: value });
    writePreference(RESTORE_LAST_PAGE_KEY, String(value));
    if (!value) get().clearLastPage();
  },
  rememberPage: (id) => {
    if (!get().restoreLastPage) return;
    set({ lastPageId: id });
    writePreference(LAST_PAGE_ID_KEY, id);
  },
  clearLastPage: () => {
    set({ lastPageId: null });
    writePreference(LAST_PAGE_ID_KEY, null);
  },
}));
