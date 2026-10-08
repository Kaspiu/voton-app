"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";

import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { schema } from "@/lib/editor-schema";
import { useSidebar } from "@/hooks/use-sidebar";
import { useWordCount } from "@/hooks/use-word-count";
import { cn } from "@/lib/utils";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

// Block types whose inline content should be counted.
const TEXT_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "quote",
  "bulletListItem",
  "checkListItem",
  "numberedListItem",
  "toggleListItem",
]);

// Reads a file and resolves with its base64 data URL for use as an editor upload handler.
const handleUpload = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// Extracts raw text in a single pass, skipping non-text nodes.
const extractCounts = (
  content: ContentItem[],
): {
  words: number;
  chars: number;
} => {
  const text = content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("");
  const trimmed = text.trim();
  return {
    words: trimmed
      ? trimmed.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length
      : 0,
    chars: text.length,
  };
};

interface ContentItem {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

interface TableCell {
  content?: ContentItem[];
}

interface TableRow {
  cells?: TableCell[];
}

interface TableContent {
  rows?: TableRow[];
}

interface EditorProps {
  onChange: (value: string) => void;
  initialData?: string;
}

export default function Editor({ onChange, initialData }: EditorProps) {
  const { resolvedTheme } = useTheme();
  const isCollapsed = useSidebar((state) => state.isCollapsed);
  const { setWordCount, setCharacterCount } = useWordCount();

  // Parses initialData as BlockNote JSON blocks, or returns undefined if absent or Markdown.
  const initialContent = useMemo(() => {
    if (!initialData) return undefined;
    try {
      return JSON.parse(initialData) as PartialBlock[];
    } catch {
      return undefined;
    }
  }, [initialData]);

  const editor = useCreateBlockNote({
    schema,
    initialContent,
    disableExtensions: ["dropFile"],
    uploadFile: handleUpload,
  });

  // If initialData exists but could not be parsed as JSON, treat it as Markdown.
  useEffect(() => {
    if (!initialData || initialContent) return;

    async function loadMarkdownContent() {
      const blocks = await editor.tryParseMarkdownToBlocks(initialData!);
      editor.replaceBlocks(editor.document, blocks);
    }

    loadMarkdownContent();
  }, [editor, initialData, initialContent]);

  // Count words and characters across all blocks (including table cells).
  const updateCounts = useCallback(() => {
    let words = 0;
    let chars = 0;

    editor.forEachBlock((block) => {
      if (TEXT_BLOCK_TYPES.has(block.type)) {
        const content = block.content as unknown as ContentItem[];
        const counts = extractCounts(content);
        words += counts.words;
        chars += counts.chars;
      }

      if (block.type === "table") {
        const tableContent = block.content as unknown as TableContent;
        tableContent.rows?.forEach((row) => {
          row.cells?.forEach((cell) => {
            const counts = extractCounts(cell.content ?? []);
            words += counts.words;
            chars += counts.chars;
          });
        });
      }

      return true;
    });

    setWordCount(words);
    setCharacterCount(chars);
  }, [editor, setWordCount, setCharacterCount]);

  // Compute initial counts once the editor is ready.
  useEffect(() => {
    updateCounts();
  }, [updateCounts]);

  const onEditorChange = () => {
    updateCounts();
    onChange(JSON.stringify(editor.document));
  };

  return (
    <BlockNoteView
      editor={editor}
      onChange={onEditorChange}
      theme={resolvedTheme === "light" ? "light" : "dark"}
      className={cn(
        "px-7.5 max-lg:px-0 transition-all duration-200",
        isCollapsed && "[@media(width>1024px)]:px-29.5",
      )}
    />
  );
}
