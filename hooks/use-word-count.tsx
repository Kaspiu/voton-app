import { create } from "zustand";

interface WordCountStore {
  wordCount: number;
  characterCount: number;
  setWordCount: (count: number) => void;
  setCharacterCount: (count: number) => void;
}

export const useWordCount = create<WordCountStore>((set) => ({
  wordCount: 0,
  characterCount: 0,
  setWordCount: (count: number) => set({ wordCount: count }),
  setCharacterCount: (count: number) => set({ characterCount: count }),
}));
