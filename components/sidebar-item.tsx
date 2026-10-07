"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  CornerUpRight,
  Copy,
  Ellipsis,
  FilePlus,
  FolderPlus,
  LucideIcon,
  Palette,
  Pen,
  Pin,
  PinOff,
  Trash,
} from "lucide-react";
import { toast } from "sonner";

import { DeleteModal } from "@/components/modals/delete-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMac } from "@/hooks/use-is-mac";
import { useMoveTo } from "@/hooks/use-move-to";
import {
  addFolder,
  addPage,
  deleteFolderWithChildren,
  deletePage,
  duplicatePage,
  getFolder,
  getPage,
  updateFolder,
  updatePage,
} from "@/lib/database/documents";
import { cn, handleButtonKeyDown } from "@/lib/utils";

// Calculates the left margin for an item based on its nesting level.
const calculateIndent = (expandLevel: number): string => {
  return expandLevel ? `${expandLevel * 24 + 14}px` : "14px";
};

interface SidebarItemProps {
  id?: string;
  parentId?: string;
  documentIcon?: string;
  isActive?: boolean;
  onExpand?: () => void;
  isExpanded?: boolean;
  expandLevel?: number;
  isPinned?: boolean;
  onPin?: () => void;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  color?: string;
  isSearch?: boolean;
  type?: "page" | "folder";
}

export const SidebarItem = ({
  id,
  parentId,
  documentIcon,
  isActive,
  onExpand,
  isExpanded,
  expandLevel = 0,
  isPinned,
  onPin,
  onClick,
  icon: Icon,
  label,
  color,
  isSearch,
  type = "page",
}: SidebarItemProps) => {
  const router = useRouter();
  const params = useParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(label || "Untitled");
  const [isEditing, setIsEditing] = useState(false);
  const isMac = useIsMac();
  const onMoveToOpen = useMoveTo((state) => state.onOpen);

  // Prevents the dropdown from auto-focusing the trigger after rename input closes.
  // Without this, closing the rename input would immediately re-focus the dropdown trigger button.
  const shouldBlockRestoreRef = useRef(false);

  // Enables inline editing mode, focuses the input, and selects all text.
  const enableInput = () => {
    shouldBlockRestoreRef.current = true;
    setTitle(label);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, label.length);
    }, 100);
  };

  // Disables inline editing mode.
  const disableInput = () => {
    setIsEditing(false);
    shouldBlockRestoreRef.current = false;
  };

  // Updates the title in the database as the user types.
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!id) return;

    const newTitle =
      e.target.value || (type === "folder" ? "New folder" : "Untitled");
    if (type === "folder") {
      updateFolder(id, { title: newTitle });
    } else {
      updatePage(id, { title: newTitle });
    }
  };

  // Exits editing mode when the user presses Enter.
  const onEnterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      disableInput();
    }
  };

  // Creates a new child page within this folder and navigates to it.
  const onCreatePage = () => {
    if (!id) return;

    const promise = addPage({
      title: "Untitled",
      parentFolder: id,
    }).then((page) => {
      if (!isExpanded) onExpand?.();
      if (page) router.push(`/documents/${page.id}`);
    });

    toast.promise(promise, {
      loading: "Creating a new page...",
      success: "New page created!",
      error: "Failed to create a new page.",
    });
  };

  // Creates a new child folder within this folder.
  const onCreateFolder = () => {
    if (!id) return;

    const promise = addFolder({
      title: "New folder",
      parentFolder: id,
    }).then(() => {
      if (!isExpanded) onExpand?.();
    });

    toast.promise(promise, {
      loading: "Creating a new folder...",
      success: "New folder created!",
      error: "Failed to create a new folder.",
    });
  };

  // Duplicates this page without changing the current route.
  const onDuplicate = () => {
    if (!id || type !== "page") return;

    toast.promise(duplicatePage(id), {
      loading: "Duplicating page...",
      success: "Page duplicated!",
      error: "Failed to duplicate page.",
    });
  };

  // Deletes this item and its children, navigating away if currently viewing it or a child.
  const onDelete = async () => {
    if (!id) return;

    let shouldRedirect = false;

    if (params.documentId === id) {
      shouldRedirect = true;
    } else if (type === "folder" && params.documentId) {
      const currentDocId = params.documentId as string;
      const page = await getPage(currentDocId);
      if (page) {
        let parentId = page.parentFolder;
        while (parentId) {
          if (parentId === id) {
            shouldRedirect = true;
            break;
          }
          const parentFolder = await getFolder(parentId);
          parentId = parentFolder?.parentFolder;
        }
      }
    }

    const promise =
      type === "folder" ? deleteFolderWithChildren(id) : deletePage(id);

    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted!",
      error: "Failed to delete.",
    });

    if (shouldRedirect) {
      promise.then(() => router.push("/documents"));
    }
  };

  const indentStyle =
    type === "page" ? { marginLeft: calculateIndent(expandLevel) } : undefined;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleButtonKeyDown}
      className={cn(
        "group mx-1 flex h-8 cursor-pointer items-center rounded-sm py-1 text-sm font-medium transition-all hover:bg-muted-foreground/10",
        isActive && "bg-muted-foreground/10 text-primary",
      )}
    >
      {!!id && type === "folder" && (
        <ChevronRight
          style={{ marginLeft: calculateIndent(expandLevel) }}
          className={cn(
            "size-4 shrink-0 transition-all",
            isExpanded && "rotate-90",
          )}
        />
      )}

      {documentIcon ? (
        <div
          style={indentStyle}
          className="mr-2 flex size-4 shrink-0 items-center justify-center text-base"
        >
          {documentIcon}
        </div>
      ) : (
        <Icon
          style={indentStyle}
          className={cn(
            "mx-2 size-4 shrink-0",
            type === "folder" && !!color && `text-${color}-500`,
          )}
        />
      )}

      {!!id && isEditing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={onChange}
          onBlur={disableInput}
          onKeyDown={onEnterKeyDown}
          className="mr-2 w-full truncate bg-transparent focus:outline-none"
        />
      ) : (
        <span className="mr-2 truncate">{label}</span>
      )}

      {isPinned && (
        <Pin className="mr-2 size-3 shrink-0 rotate-45 text-muted-foreground/50" />
      )}

      {isSearch && (
        <div className="pointer-events-none ml-auto mr-2 flex select-none items-center gap-1 text-xs font-medium">
          <kbd className="flex h-5 items-center justify-center rounded-sm border border-muted-foreground/10 bg-secondary px-2 font-mono">
            {isMac ? "⌘" : "Ctrl"}
          </kbd>
          <span>+</span>
          <kbd className="flex h-5 items-center justify-center rounded-sm border border-muted-foreground/10 bg-secondary px-2 font-mono">
            K
          </kbd>
        </div>
      )}

      {!!id && (
        <div className="ml-auto mr-2">
          <DropdownMenu>
            <DropdownMenuTrigger onClick={(e) => e.stopPropagation()} asChild>
              <button
                aria-label={`More options for ${label}`}
                className="flex size-6 cursor-pointer items-center justify-center rounded-sm p-0.5 opacity-0 transition-all hover:bg-muted-foreground/15 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:bg-muted-foreground/15 data-[state=open]:opacity-100 max-[1025px]:opacity-100"
              >
                <Ellipsis className="size-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="right"
              onClick={(e) => e.stopPropagation()}
              onCloseAutoFocus={(e) => {
                if (shouldBlockRestoreRef.current) {
                  e.preventDefault();
                }
              }}
            >
              {type === "folder" && (
                <>
                  <DropdownMenuItem onSelect={onCreatePage}>
                    <FilePlus className="h-4 w-4 shrink-0" />
                    Create page
                  </DropdownMenuItem>

                  <DropdownMenuItem onSelect={onCreateFolder}>
                    <FolderPlus className="h-4 w-4 shrink-0" />
                    Create folder
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onSelect={enableInput}>
                <Pen className="h-4 w-4 shrink-0" />
                Rename
              </DropdownMenuItem>

              {type === "page" && (
                <DropdownMenuItem onSelect={onDuplicate}>
                  <Copy className="h-4 w-4 shrink-0" />
                  Duplicate
                </DropdownMenuItem>
              )}

              {type === "folder" && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="h-4 w-4 shrink-0" />
                    Colors
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup
                        value={color || ""}
                        onValueChange={(value) => {
                          if (!id) return;
                          updateFolder(id, { color: value });
                        }}
                      >
                        <DropdownMenuRadioItem value="">
                          Default
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="gray"
                          className="text-gray-500"
                        >
                          Gray
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="red"
                          className="text-red-500"
                        >
                          Red
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="orange"
                          className="text-orange-500"
                        >
                          Orange
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="yellow"
                          className="text-yellow-500"
                        >
                          Yellow
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="green"
                          className="text-green-500"
                        >
                          Green
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="blue"
                          className="text-blue-500"
                        >
                          Blue
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="purple"
                          className="text-purple-500"
                        >
                          Purple
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem
                          value="pink"
                          className="text-pink-500"
                        >
                          Pink
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => {
                  if (!id) return;
                  onMoveToOpen({ id, type, parentId });
                }}
              >
                <CornerUpRight className="h-4 w-4 shrink-0" />
                Move to
              </DropdownMenuItem>

              {onPin && (
                <DropdownMenuItem onSelect={onPin}>
                  {isPinned ? (
                    <>
                      <PinOff className="h-4 w-4 shrink-0" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 shrink-0" />
                      Pin to top
                    </>
                  )}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DeleteModal
                onDelete={onDelete}
                name={label}
                isFolder={type === "folder"}
              >
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
        </div>
      )}
    </div>
  );
};
