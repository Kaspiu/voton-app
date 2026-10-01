import {
  BlockNoteEditor,
  blockToNode,
  BlockNoteSchema,
  defaultBlockSpecs,
  createCodeBlockSpec,
  type PartialBlock,
  type PropSchema,
} from "@blocknote/core";
import { codeBlockOptions } from "@blocknote/code-block";

// The default "file" block spec is omitted; all other defaults are preserved.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { file: _file, ...blockSpecs } = defaultBlockSpecs;

const customCodeBlock = createCodeBlockSpec({
  indentLineWithTab: true,
  defaultLanguage: "typescript",
  supportedLanguages: {
    plaintext: { name: "Plain Text", aliases: ["text"] },
    typescript: { name: "TypeScript", aliases: ["ts"] },
    javascript: { name: "JavaScript", aliases: ["js"] },
    python: { name: "Python", aliases: ["py"] },
    java: { name: "Java" },
    csharp: { name: "C#", aliases: ["cs"] },
    cpp: { name: "C++", aliases: ["c++"] },
    go: { name: "Go", aliases: ["golang"] },
    rust: { name: "Rust", aliases: ["rs"] },
    php: { name: "PHP" },
    ruby: { name: "Ruby", aliases: ["rb"] },
    swift: { name: "Swift" },
    kotlin: { name: "Kotlin", aliases: ["kt"] },
    html: { name: "HTML" },
    css: { name: "CSS" },
    sql: { name: "SQL" },
    bash: { name: "Bash", aliases: ["shell", "sh"] },
    json: { name: "JSON" },
    yaml: { name: "YAML", aliases: ["yml"] },
    markdown: { name: "Markdown", aliases: ["md"] },
  },
  createHighlighter: codeBlockOptions.createHighlighter,
});

// Schema combining preserved default blocks with the custom code block.
export const schema = BlockNoteSchema.create({
  blockSpecs: { ...blockSpecs, codeBlock: customCodeBlock },
});

let validateBlocks: ((blocks: unknown[]) => void) | undefined;

export function validateEditorBlocks(blocks: unknown[]): void {
  if (!validateBlocks) {
    const editor = BlockNoteEditor.create({ schema });
    // ProseMirror checks structure but does not validate the type of link addresses.
    const checkLinks = (content: unknown): void => {
      if (Array.isArray(content)) {
        content.forEach(checkLinks);
      } else if (content && typeof content === "object") {
        const value = content as Record<string, unknown>;
        if (value.type === "link" && typeof value.href !== "string") {
          throw new Error("Invalid editor link address");
        }
        // Follow inline content and both supported table cell formats.
        checkLinks(value.content);
        checkLinks(value.rows);
        checkLinks(value.cells);
      }
    };
    const checkShape = (block: unknown): void => {
      if (!block || typeof block !== "object" || Array.isArray(block)) {
        throw new Error("Invalid editor block");
      }
      const value = block as Record<string, unknown>;
      if (
        value.type !== undefined &&
        (typeof value.type !== "string" || !Object.hasOwn(schema.blockSchema, value.type))
      ) {
        throw new Error("Unknown editor block type");
      }
      if (value.id !== undefined && (typeof value.id !== "string" || !value.id.trim())) {
        throw new Error("Invalid editor block ID");
      }
      if (
        value.props !== undefined &&
        (!value.props || typeof value.props !== "object" || Array.isArray(value.props))
      ) {
        throw new Error("Invalid editor block properties");
      }
      if (value.props) {
        const props = value.props as Record<string, unknown>;
        const propSchema: PropSchema = schema.blockSchema[
          (value.type ?? "paragraph") as keyof typeof schema.blockSchema
        ].propSchema;
        for (const [name, spec] of Object.entries(propSchema)) {
          const prop = props[name];
          if (prop === undefined) continue; // Omitted properties use editor defaults.
          const expectedType = spec.default === undefined ? spec.type : typeof spec.default;
          if (
            typeof prop !== expectedType ||
            (typeof prop === "number" && !Number.isFinite(prop)) ||
            (spec.values && !spec.values.some((allowed) => allowed === prop))
          ) {
            throw new Error(`Invalid editor block property: ${name}`);
          }
        }
      }
      if (
        value.content !== undefined && typeof value.content !== "string" &&
        !Array.isArray(value.content) &&
        (!value.content || typeof value.content !== "object")
      ) {
        throw new Error("Invalid editor block content");
      }
      checkLinks(value.content);
      if (value.children !== undefined) {
        if (!Array.isArray(value.children)) throw new Error("Invalid editor children");
        value.children.forEach(checkShape);
      }
    };
    validateBlocks = (values) => {
      for (const block of values) {
        checkShape(block);
        const node = blockToNode(block as PartialBlock, editor.pmSchema, schema.styleSchema);
        // Match BlockNote's loading path, which normalizes inline mark order through JSON.
        editor.pmSchema.nodeFromJSON(node.toJSON()).check();
      }
    };
  }
  validateBlocks(blocks);
}
