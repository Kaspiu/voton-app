"use client";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearch } from "@/hooks/use-search";
import { getAllFolders, getAllPages } from "@/lib/database/documents";
import { Folder, Page } from "@/lib/database/types";

const SEARCH_SHORTCUT_KEY = "k";

const getFolderPath = (
  parentId: string | undefined,
  folders: Map<string, Folder>,
): string => {
  const names: string[] = [];
  const visited = new Set<string>();
  let id = parentId;

  while (id) {
    if (visited.has(id)) return "Folder unavailable";
    visited.add(id);

    const folder = folders.get(id);
    if (!folder) return "Folder unavailable";
    names.unshift(folder.title || "Untitled folder");
    id = folder.parentFolder;
  }

  return ["Workspace", ...names].join(" / ");
};

const filterByTitleAndPath = (
  _value: string,
  search: string,
  keywords?: string[],
): number => {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return 1;
  return keywords?.some((keyword) =>
    keyword.toLocaleLowerCase().includes(query),
  )
    ? 1
    : 0;
};

export const SearchCommand = () => {
  const router = useRouter();
  const { isOpen, onClose, toggle } = useSearch();
  const [workspace, setWorkspace] = useState<{
    pages: Page[];
    folders: Folder[];
  }>({ pages: [], folders: [] });

  // Fetches all pages and re-fetches whenever workspace items change or are deleted.
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const [pages, folders] = await Promise.all([
          getAllPages(),
          getAllFolders(),
        ]);
        setWorkspace({ pages, folders });
      } catch (error) {
        console.error("Failed to fetch workspace for search:", error);
      }
    };

    fetchWorkspace();

    window.addEventListener("item-changed", fetchWorkspace);
    window.addEventListener("item-deleted", fetchWorkspace);

    return () => {
      window.removeEventListener("item-changed", fetchWorkspace);
      window.removeEventListener("item-deleted", fetchWorkspace);
    };
  }, []);

  // Registers the Ctrl/Cmd+K keyboard shortcut to open or close the search palette.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === SEARCH_SHORTCUT_KEY && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  // Navigates to the selected page and closes the search palette.
  const onSelect = (id: string) => {
    router.push(`/documents/${id}`);
    onClose();
  };

  const foldersById = new Map(
    workspace.folders.map((folder) => [folder.id, folder]),
  );

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={onClose}
      title="Search pages"
      description="Search page titles and folder paths."
      filter={filterByTitleAndPath}
    >
      <CommandInput
        placeholder="Search page titles or folder paths..."
        aria-label="Search page titles or folder paths"
      />
      <CommandList>
        <CommandGroup heading="Pages">
          {workspace.pages.map((page) => {
            const path = getFolderPath(page.parentFolder, foldersById);

            return (
              <CommandItem
                key={page.id}
                onSelect={() => onSelect(page.id)}
                value={page.id}
                keywords={[page.title, path]}
              >
                {page.icon ? (
                  <div>{page.icon}</div>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{page.title}</span>
                  <span className="text-xs text-muted-foreground/50">
                    {path}
                  </span>
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </CommandDialog>
  );
};
