"use client";

import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const THEME_MAP: Record<string, Theme> = {
  light: Theme.LIGHT,
  dark: Theme.DARK,
};

const DEFAULT_THEME = "light";

interface EmojiPickerProps {
  children: React.ReactNode;
  onEmojiClick: (emoji: string) => void;
  asChild?: boolean;
}

export const EmojiPickerPopover = ({
  onEmojiClick,
  children,
  asChild,
}: EmojiPickerProps) => {
  const { resolvedTheme } = useTheme();
  const theme = THEME_MAP[resolvedTheme ?? DEFAULT_THEME] ?? Theme.LIGHT;

  return (
    <Popover>
      <PopoverTrigger asChild={asChild}>{children}</PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <EmojiPicker
          height={500}
          theme={theme}
          onEmojiClick={(data) => onEmojiClick(data.emoji)}
        />
      </PopoverContent>
    </Popover>
  );
};
