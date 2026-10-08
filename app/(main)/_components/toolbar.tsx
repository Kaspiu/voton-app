"use client";

import { useRef, useState } from "react";
import { ImagePlus, SmilePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmojiPickerPopover } from "@/components/emoji-picker";
import { useCoverImage } from "@/hooks/use-cover-image";
import { useSidebar } from "@/hooks/use-sidebar";
import { updatePage } from "@/lib/database/documents";
import { Page } from "@/lib/database/types";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  initialData: Page;
}

export const Toolbar = ({ initialData }: ToolbarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialData.title || "Untitled");

  const onCoverImageOpen = useCoverImage((state) => state.onOpen);
  const isCollapsed = useSidebar((state) => state.isCollapsed);

  // Enables title editing mode, focuses the input, and selects all text.
  const enableInput = () => {
    setTitle(initialData.title);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(0, initialData.title.length);
    }, 100);
  };

  // Disables title editing mode.
  const disableInput = () => {
    setIsEditing(false);
  };

  // Updates the page title in the database as the user types.
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    updatePage(initialData.id, {
      title: e.target.value || "Untitled",
    });
  };

  // Exits editing mode when the user presses Enter.
  const onEnterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      disableInput();
    }
  };

  // Updates the page icon with the selected emoji.
  const onEmojiSelect = (emoji: string) => {
    updatePage(initialData.id, { icon: emoji });
  };

  // Removes the page icon.
  const onEmojiDelete = () => {
    updatePage(initialData.id, { icon: undefined });
  };

  return (
    <div
      className={cn(
        "group mb-12 mt-6 flex flex-col justify-center px-21 max-lg:px-13.5 transition-all duration-200",
        isCollapsed && "[@media(width>1024px)]:px-42",
      )}
    >
      <div
        className={cn(
          "mb-2 flex w-fit items-center gap-2 opacity-0 transition-all group-hover:opacity-100 group-focus-within:opacity-100 max-[1025px]:flex-wrap max-[1025px]:opacity-100",
          !!initialData.icon && "mb-4",
        )}
      >
        {!initialData.icon && (
          <EmojiPickerPopover asChild onEmojiClick={onEmojiSelect}>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer text-xs text-muted-foreground"
            >
              <SmilePlus className="h-4 w-4" />
              Add icon
            </Button>
          </EmojiPickerPopover>
        )}
        {!initialData.coverImage && (
          <Button
            onClick={onCoverImageOpen}
            variant="outline"
            size="sm"
            className="cursor-pointer text-xs text-muted-foreground"
          >
            <ImagePlus className="h-4 w-4" />
            Add cover
          </Button>
        )}
      </div>

      {!!initialData.icon && (
        <div className="group/icon mb-2 flex w-fit items-center gap-2">
          <EmojiPickerPopover onEmojiClick={onEmojiSelect}>
            <p className="cursor-pointer text-6xl max-lg:text-5xl transition-all hover:opacity-75">
              {initialData.icon}
            </p>
          </EmojiPickerPopover>
          <Button
            onClick={onEmojiDelete}
            aria-label="Remove page icon"
            variant="outline"
            size="icon"
            className="cursor-pointer rounded-lg text-xs text-muted-foreground opacity-0 transition-all group-hover/icon:opacity-100 group-focus-within:opacity-100 max-[1025px]:opacity-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          value={title}
          onBlur={disableInput}
          onKeyDown={onEnterKeyDown}
          onChange={onChange}
          className="flex h-15 max-lg:h-12 w-full items-center text-6xl max-lg:text-5xl font-bold text-[#3F3F3F] focus:outline-none dark:text-[#CFCFCF]"
        />
      ) : (
        <div
          role="button"
          onClick={enableInput}
          className="flex max-w-fit items-center text-6xl max-lg:text-5xl font-bold text-[#3F3F3F] dark:text-[#CFCFCF]"
        >
          {initialData.title}
        </div>
      )}
    </div>
  );
};
