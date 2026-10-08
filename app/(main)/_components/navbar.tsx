"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  Copy,
  Download,
  Ellipsis,
  TextInitial,
  Menu,
  Trash,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { DeleteModal } from "@/components/modals/delete-modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePage, duplicatePage, getPage } from "@/lib/database/documents";
import { exportPage } from "@/lib/database/export-import";
import { useSettings } from "@/hooks/use-settings";
import { useWordCount } from "@/hooks/use-word-count";
import { handleButtonKeyDown } from "@/lib/utils";

const MS_PER_MINUTE = 60000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const MS_PER_YEAR = 365 * MS_PER_DAY;

// Returns a relative time label, e.g. "Edited 3h ago"
const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / MS_PER_MINUTE);

  if (minutes <= 1) return "Edited just now";
  if (minutes < 60) return `Edited ${minutes}m ago`;

  const hours = Math.floor(diff / MS_PER_HOUR);
  if (hours < 24) return `Edited ${hours}h ago`;

  const days = Math.floor(diff / MS_PER_DAY);
  if (days < 30) return `Edited ${days}d ago`;

  const months = Math.floor(diff / MS_PER_MONTH);
  if (days < 365) return `Edited ${months}mo ago`;

  const years = Math.floor(diff / MS_PER_YEAR);
  return `Edited ${years}y ago`;
};

// Returns a short date string, e.g. "Apr 12, 2024"
const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `Created on ${month} ${day}, ${year}`;
};

interface NavbarProps {
  isCollapsed: boolean;
  onResetWidth: () => void;
}

export const Navbar = ({ isCollapsed, onResetWidth }: NavbarProps) => {
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;

  const [title, setTitle] = useState<string | undefined>(undefined);
  const [createdAt, setCreatedAt] = useState<number>();
  const [updatedAt, setUpdatedAt] = useState<number>();
  const [isExporting, setIsExporting] = useState(false);
  const exportInProgress = useRef(false);

  const formattedCreatedAt = createdAt ? formatDate(createdAt) : "";
  const formattedUpdatedAt = updatedAt ? formatRelativeTime(updatedAt) : "";

  const wordCount = useWordCount((state) => state.wordCount);
  const characterCount = useWordCount((state) => state.characterCount);
  const clearLastPage = useSettings((state) => state.clearLastPage);

  // Keeps navbar metadata in sync with external document updates
  useEffect(() => {
    const fetchPage = async () => {
      if (!documentId) return;

      const page = await getPage(documentId);
      if (page) {
        setTitle(page.title);
        setCreatedAt(page.createdAt);
        setUpdatedAt(page.updatedAt);
      }
    };

    fetchPage();

    window.addEventListener("item-changed", fetchPage);
    return () => window.removeEventListener("item-changed", fetchPage);
  }, [documentId]);

  const onDuplicate = () => {
    if (!documentId) return;

    toast.promise(duplicatePage(documentId), {
      loading: "Duplicating page...",
      success: "Page duplicated!",
      error: "Failed to duplicate page.",
    });
  };

  const onExport = () => {
    if (!documentId || exportInProgress.current) return;

    exportInProgress.current = true;
    setIsExporting(true);
    const promise = exportPage(documentId).finally(() => {
      exportInProgress.current = false;
      setIsExporting(false);
    });

    toast.promise(promise, {
      loading: "Preparing page export...",
      success: "Page export ready!",
      error: "Failed to export page. Please try again.",
    });
  };

  const onClose = () => {
    clearLastPage();
    router.push("/documents");
  };

  const onDelete = () => {
    if (!documentId) return;

    const promise = deletePage(documentId);

    toast.promise(promise, {
      loading: "Deleting page...",
      success: "Page deleted!",
      error: "Failed to delete page.",
    });

    promise.then(() => router.push("/documents"));
  };

  return (
    <nav className="flex w-full items-center gap-4 bg-background p-4 dark:bg-[#1F1F1F]">
      {isCollapsed && (
        <div
          onClick={onResetWidth}
          role="button"
          tabIndex={0}
          onKeyDown={handleButtonKeyDown}
          aria-label="Expand sidebar"
          className="h-fit w-fit cursor-pointer rounded-md p-[3px] text-muted-foreground transition-all hover:bg-muted-foreground/10"
        >
          <Menu className="h-6 w-6 shrink-0" />
        </div>
      )}
      <div className="flex h-[30px] min-w-0 flex-1 items-center justify-between gap-4">
        {title === undefined ? (
          <Skeleton className="h-6 w-17" />
        ) : (
          <span className="truncate text-lg font-medium text-muted-foreground">
            {title}
          </span>
        )}

        <div className="flex items-center justify-center gap-2">
          {title === undefined ? (
            <Skeleton className="h-6 w-26.5" />
          ) : (
            <>
              {updatedAt && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label="Page dates"
                      className="h-fit w-fit cursor-pointer rounded-md p-[7px] text-muted-foreground transition-all hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10"
                    >
                      <Clock className="h-4 w-4 shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    side="bottom"
                    className="flex flex-col gap-0.5 text-xs font-medium text-muted-foreground"
                  >
                    <span className="px-2 pt-1">{formattedUpdatedAt}</span>
                    <span className="px-2 pb-1 text-muted-foreground/75">
                      {formattedCreatedAt}
                    </span>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Word and character counts"
                    className="h-fit w-fit cursor-pointer rounded-md p-[7px] text-muted-foreground transition-all hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10"
                  >
                    <TextInitial className="h-4 w-4 shrink-0" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  className="flex flex-col gap-0.5 text-xs font-medium text-muted-foreground"
                >
                  <span className="px-2 pt-1">
                    Word count: {wordCount} {wordCount === 1 ? "word" : "words"}
                  </span>
                  <span className="px-2 pb-1 text-muted-foreground/75">
                    Character count: {characterCount}{" "}
                    {characterCount === 1 ? "character" : "characters"}
                  </span>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Page options"
                    className="h-fit w-fit cursor-pointer rounded-md p-[3px] text-muted-foreground transition-all hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10"
                  >
                    <Ellipsis className="h-6 w-6 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={onDuplicate}>
                    <Copy className="h-4 w-4 shrink-0" />
                    Duplicate
                  </DropdownMenuItem>

                  <DropdownMenuItem disabled={isExporting} onSelect={onExport}>
                    <Download className="h-4 w-4 shrink-0" />
                    Export as JSON
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onSelect={onClose}>
                    <X className="h-4 w-4 shrink-0" />
                    Close
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DeleteModal onDelete={onDelete} name={title || "Untitled"}>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      variant="destructive"
                    >
                      <div className="flex items-center gap-2">
                        <Trash className="h-4 w-4 shrink-0 text-destructive" />
                        Delete
                      </div>
                    </DropdownMenuItem>
                  </DeleteModal>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
