import { create } from "zustand";

interface FocusModeStore {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
}

export const useFocusMode = create<FocusModeStore>((set) => ({
  isFocusMode: false,
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode })),
  setFocusMode: (value: boolean) => set({ isFocusMode: value }),
}));
