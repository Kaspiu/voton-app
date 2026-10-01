// Legacy Markdown remains supported. JSON content must be readable by our editor schema.
export async function validateEditorContent(content: string | undefined): Promise<void> {
  if (!content) return;
  let blocks: unknown;
  try {
    blocks = JSON.parse(content);
  } catch {
    return;
  }
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("Editor content must contain a non-empty array of blocks");
  }

  const { validateEditorBlocks } = await import("../editor-schema");
  validateEditorBlocks(blocks);
}

// A .md file containing valid JSON is still Markdown text, not serialized editor blocks.
export function prepareMarkdownContent(markdown: string): string {
  try {
    JSON.parse(markdown);
  } catch {
    return markdown;
  }
  return JSON.stringify([{ type: "paragraph", content: markdown }]);
}
