"use client";

import { useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useIsMac } from "@/hooks/use-is-mac";
import { useShortcuts } from "@/hooks/use-shortcuts";

const SHORTCUTS_KEY = "/";
const SHORTCUTS_CODE = "Slash";

interface ShortcutItemProps {
  title: string;
  description: string;
  shortcut: string[];
}

const ShortcutItem = ({ title, description, shortcut }: ShortcutItemProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2 mr-8">
        <Label>{title}</Label>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground pointer-events-none select-none">
        {shortcut.map((key, index) => (
          <div key={key} className="flex items-center gap-1">
            {index > 0 && <span>+</span>}
            <kbd className="flex items-center rounded-sm border bg-secondary px-2 font-mono">
              {key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ShortcutsModal = () => {
  const { isOpen, onClose, toggle } = useShortcuts();
  const isMac = useIsMac();

  // Registers the Ctrl/Cmd+Alt+/ shortcut to open or close the shortcuts dialog.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (
        (e.key === SHORTCUTS_KEY || e.code === SHORTCUTS_CODE) &&
        (e.ctrlKey || e.metaKey) &&
        e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent closeClassName="top-6 right-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>

        <h3 className="text-lg font-semibold leading-none">Workspace</h3>
        <div className="flex flex-col gap-4">
          <ShortcutItem
            title="Search pages"
            description="Find and open a page in your workspace."
            shortcut={isMac ? ["⌘", "K"] : ["Ctrl", "K"]}
          />
          <ShortcutItem
            title="Create a page"
            description="Create an untitled page at the workspace's top level and open it."
            shortcut={isMac ? ["⌘", "⌥", "P"] : ["Ctrl", "Alt", "P"]}
          />
          <ShortcutItem
            title="Create a folder"
            description="Create a folder at the workspace's top level."
            shortcut={isMac ? ["⌘", "⌥", "F"] : ["Ctrl", "Alt", "F"]}
          />
        </div>

        <Separator />

        <h3 className="text-lg font-semibold leading-none">View</h3>
        <div className="flex flex-col gap-4">
          <ShortcutItem
            title="Toggle sidebar"
            description="Show or hide the workspace sidebar."
            shortcut={isMac ? ["⌘", "\\"] : ["Ctrl", "\\"]}
          />
          <ShortcutItem
            title="Toggle focus mode"
            description="Hide the sidebar and navbar while writing on desktop."
            shortcut={isMac ? ["⌘", "⇧", "F"] : ["Ctrl", "Shift", "F"]}
          />
        </div>

        <Separator />

        <ShortcutItem
          title="Show all shortcuts"
          description="Open or close this guide."
          shortcut={isMac ? ["⌘", "⌥", "/"] : ["Ctrl", "Alt", "/"]}
        />
      </DialogContent>
    </Dialog>
  );
};
