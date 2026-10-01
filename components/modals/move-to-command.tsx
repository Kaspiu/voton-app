"use client";

import { Folder as FolderIcon, Trash } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMoveTo } from "@/hooks/use-move-to";
import {
  getAllFolders,
  updateFolder,
  updatePage,
} from "@/lib/database/documents";
import { Folder } from "@/lib/database/types";
import { cn } from "@/lib/utils";

export const MoveToCommand = () => {
  const { data, onClose } = useMoveTo();
  const [folders, setFolders] = useState<Folder[]>([]);

  const isOpen = !!data;

  // Fetches all folders and re-fetches whenever workspace items change or are deleted.
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        setFolders(await getAllFolders());
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    };

    fetchFolders();

    window.addEventListener("item-changed", fetchFolders);
    window.addEventListener("item-deleted", fetchFolders);

    return () => {
      window.removeEventListener("item-changed", fetchFolders);
      window.removeEventListener("item-deleted", fetchFolders);
    };
  }, []);

  // Moves the current item to the selected folder and closes the command palette.
  const onSelect = (folderId: string) => {
    if (!data) return;

    if (data.type === "page") {
      updatePage(data.id, { parentFolder: folderId });
    } else {
      updateFolder(data.id, { parentFolder: folderId });
    }

    onClose();
  };

  // Removes the current item from its parent folder and closes the command palette.
  const onRemove = () => {
    if (!data) return;

    if (data.type === "page") {
      updatePage(data.id, { parentFolder: undefined });
    } else {
      updateFolder(data.id, { parentFolder: undefined });
    }

    onClose();
  };

  // Filters folders to exclude the item itself, its current parent, and any descendants
  // (when moving a folder) to prevent circular folder references.
  const filteredFolders = data
    ? folders.filter((folder) => {
        if (folder.id === data.id) return false;
        if (folder.id === data.parentId) return false;

        if (data.type === "folder") {
          let parent = folder.parentFolder;
          while (parent) {
            if (parent === data.id) return false;
            const parentFolder = folders.find((f) => f.id === parent);
            parent = parentFolder?.parentFolder;
          }
        }

        return true;
      })
    : [];

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput placeholder="Search your workspace..." />
      <CommandList>
        <CommandGroup heading="Folders">
          {!!data?.parentId && (
            <CommandItem
              onSelect={onRemove}
              value="remove-from-folder"
              className="data-[selected=true]:bg-destructive/20 dark:data-[selected=true]:bg-destructive/30"
            >
              <Trash className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">
                Remove from folder
              </span>
            </CommandItem>
          )}
          {filteredFolders.map((folder) => (
            <CommandItem
              key={folder.id}
              title={folder.title}
              onSelect={() => onSelect(folder.id)}
              value={`${folder.id}-${folder.title}`}
            >
              <FolderIcon
                className={cn(
                  "h-4 w-4",
                  folder.color && `text-${folder.color}-500`,
                )}
              />
              <span className="font-medium">{folder.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </CommandDialog>
  );
};
