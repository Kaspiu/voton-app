import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
}

export const useSidebar = create<SidebarStore>((set) => ({
  isCollapsed: false,
  onCollapse: () => set({ isCollapsed: true }),
  onExpand: () => set({ isCollapsed: false }),
}));
