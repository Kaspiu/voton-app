"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FileText, Folder as FolderIcon } from "lucide-react";

import { SidebarItem } from "@/components/sidebar-item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getChildFolders,
  getChildPages,
  getRootFolders,
  getRootPages,
} from "@/lib/database/documents";
import { Folder, Page } from "@/lib/database/types";
import { cn } from "@/lib/utils";

type DocumentItem = (Page & { type: "page" }) | (Folder & { type: "folder" });

// Loads the expanded state of folders from localStorage, returning an empty object on error.
const loadExpandedState = (): Record<string, boolean> => {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem("sidebar-expanded-folders") || "{}");
  } catch (error) {
    console.error("Failed to load sidebar state:", error);
    return {};
  }
};

// Saves the expanded state of a specific folder to localStorage.
const saveExpandedState = (id: string, isExpanded: boolean): void => {
  try {
    const currentState = JSON.parse(
      localStorage.getItem("sidebar-expanded-folders") || "{}",
    );
    if (isExpanded) {
      currentState[id] = true;
    } else {
      delete currentState[id];
    }
    localStorage.setItem(
      "sidebar-expanded-folders",
      JSON.stringify(currentState),
    );
  } catch (error) {
    console.error("Failed to save sidebar state:", error);
  }
};

// Loads the pinned state of items from localStorage, returning an empty object on error.
const loadPinnedState = (): Record<string, boolean> => {
  try {
    if (typeof window === "undefined") return {};
    return JSON.parse(localStorage.getItem("sidebar-pinned-items") || "{}");
  } catch (error) {
    console.error("Failed to load pinned state:", error);
    return {};
  }
};

// Saves the pinned state of a specific item to localStorage.
const savePinnedState = (id: string, isPinned: boolean): void => {
  try {
    const currentState = JSON.parse(
      localStorage.getItem("sidebar-pinned-items") || "{}",
    );
    if (isPinned) {
      currentState[id] = true;
    } else {
      delete currentState[id];
    }
    localStorage.setItem("sidebar-pinned-items", JSON.stringify(currentState));
  } catch (error) {
    console.error("Failed to save pinned state:", error);
  }
};

interface DocumentsListProps {
  parentDocumentId?: string;
  expandLevel?: number;
}

export const DocumentsList = ({
  parentDocumentId,
  expandLevel = 0,
}: DocumentsListProps) => {
  const params = useParams();
  const router = useRouter();

  const paddingLeft = expandLevel ? `${expandLevel * 24 + 18}px` : "18px";

  const [documents, setDocuments] = useState<DocumentItem[] | undefined>(
    undefined,
  );
  const [isExpanded, setIsExpanded] =
    useState<Record<string, boolean>>(loadExpandedState);
  const [pinned, setPinned] =
    useState<Record<string, boolean>>(loadPinnedState);

  // Toggles the expansion state of a folder in both state and localStorage.
  const onExpand = (id: string) => {
    setIsExpanded((prev) => {
      const newValue = !prev[id];
      saveExpandedState(id, newValue);
      return { ...prev, [id]: newValue };
    });
  };

  // Toggles the pinned state of an item, persisting it to localStorage.
  const onPin = (id: string) => {
    setPinned((prev) => {
      const newValue = !prev[id];
      savePinnedState(id, newValue);
      return { ...prev, [id]: newValue };
    });
  };

  // Navigates to the selected page.
  const onRedirect = (id: string) => {
    router.push(`/documents/${id}`);
  };

  // Fetches documents and re-fetches whenever workspace items change or are deleted.
  useEffect(() => {
    const fetchPages = async () => {
      try {
        let fetchedPages: Page[] = [];
        let fetchedFolders: Folder[] = [];

        if (parentDocumentId) {
          fetchedPages = await getChildPages(parentDocumentId);
          fetchedFolders = await getChildFolders(parentDocumentId);
        } else {
          fetchedPages = await getRootPages();
          fetchedFolders = await getRootFolders();
        }

        setDocuments([
          ...fetchedFolders.map((f) => ({ ...f, type: "folder" as const })),
          ...fetchedPages.map((p) => ({ ...p, type: "page" as const })),
        ]);
      } catch (error) {
        console.error("Failed to fetch pages:", error);
      }
    };

    fetchPages();

    window.addEventListener("item-changed", fetchPages);
    window.addEventListener("item-deleted", fetchPages);

    return () => {
      window.removeEventListener("item-changed", fetchPages);
      window.removeEventListener("item-deleted", fetchPages);
    };
  }, [parentDocumentId]);

  if (documents === undefined) {
    return (
      <>
        {expandLevel === 0 ? (
          <div className="py-2">
            <div
              style={{ paddingLeft }}
              className="mb-3 flex h-5 items-center gap-2"
            >
              <Skeleton className="h-4 w-10 rounded-sm" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>

            <div
              style={{ paddingLeft }}
              className="flex h-5 items-center gap-2"
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
          </div>
        ) : (
          <div
            style={{ paddingLeft }}
            className="flex h-8 items-center gap-2 py-1"
          >
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-sm" />
          </div>
        )}
      </>
    );
  }

  // Pinning is only available and sorted at the root level.
  const sortedDocuments =
    expandLevel === 0
      ? [
          ...documents.filter((doc) => pinned[doc.id]),
          ...documents.filter((doc) => !pinned[doc.id]),
        ]
      : documents;

  return (
    <>
      <p
        style={{ paddingLeft }}
        className={cn(
          "hidden h-6 items-center truncate pr-3 text-sm font-medium text-muted-foreground/50",
          expandLevel === 0 && "hidden",
          expandLevel > 0 && "last:flex",
        )}
      >
        No documents inside
      </p>

      {sortedDocuments.map((doc) => (
        <div key={doc.id}>
          <SidebarItem
            id={doc.id}
            parentId={doc.parentFolder}
            label={doc.title}
            icon={doc.type === "folder" ? FolderIcon : FileText}
            documentIcon={doc.type === "page" ? doc.icon : undefined}
            color={doc.type === "folder" ? doc.color : undefined}
            isActive={params.documentId === doc.id}
            isExpanded={isExpanded[doc.id]}
            expandLevel={expandLevel}
            isPinned={expandLevel === 0 ? !!pinned[doc.id] : undefined}
            onPin={expandLevel === 0 ? () => onPin(doc.id) : undefined}
            onClick={
              doc.type === "page"
                ? () => onRedirect(doc.id)
                : () => onExpand(doc.id)
            }
            onExpand={() => onExpand(doc.id)}
            type={doc.type}
          />

          {isExpanded[doc.id] && (
            <DocumentsList
              parentDocumentId={doc.id}
              expandLevel={expandLevel + 1}
            />
          )}
        </div>
      ))}
    </>
  );
};
