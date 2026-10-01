import { create } from "zustand";

interface MoveToData {
  id: string;
  type: "page" | "folder";
  parentId?: string;
}

interface MoveToStore {
  data?: MoveToData;
  onOpen: (data: MoveToData) => void;
  onClose: () => void;
}

export const useMoveTo = create<MoveToStore>((set) => ({
  data: undefined,
  onOpen: (data) => set({ data }),
  onClose: () => set({ data: undefined }),
}));
