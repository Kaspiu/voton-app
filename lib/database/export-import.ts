import { getDB, runWriteTransaction } from "./database";
import { addPage, getPage, notifyChanges, notifyDelete } from "./documents";
import { prepareMarkdownContent, validateEditorContent } from "./content";
import { validateHierarchy } from "./hierarchy";
import { Folder, Page } from "./types";

const EXPORT_VERSION = "0.2.68";
const ACCEPTED_FILE_TYPES = ".json,.md";

export interface VotonExportData {
  version: string;
  exportDate: string;
  pages: Page[];
  folders: Folder[];
}

const OPTIONAL_PAGE_PROPS: (keyof Page)[] = [
  "parentFolder",
  "content",
  "coverImage",
  "icon",
];

const OPTIONAL_FOLDER_PROPS: (keyof Folder)[] = ["parentFolder", "color"];

function isValidTimestamp(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      Math.abs(value) <= 8.64e15)
  );
}

// Returns true if every optional string prop on a page is either absent or a string, and createdAt and updatedAt are absent or numbers.
function isValidPage(page: unknown): page is Page {
  if (!page || typeof page !== "object" || Array.isArray(page)) return false;

  const p = page as Page;
  if (typeof p.id !== "string" || !p.id.trim() || typeof p.title !== "string")
    return false;

  const stringsValid = OPTIONAL_PAGE_PROPS.every(
    (prop) => !(prop in p) || typeof p[prop] === "string",
  );
  if (!stringsValid) return false;

  return isValidTimestamp(p.createdAt) && isValidTimestamp(p.updatedAt);
}

// Returns true if every optional string prop on a folder is either absent or a string.
function isValidFolder(folder: unknown): folder is Folder {
  if (!folder || typeof folder !== "object" || Array.isArray(folder))
    return false;

  const f = folder as Folder;
  if (typeof f.id !== "string" || !f.id.trim() || typeof f.title !== "string")
    return false;

  return OPTIONAL_FOLDER_PROPS.every(
    (prop) => !(prop in f) || typeof f[prop] === "string",
  );
}

// Returns true if the data object conforms to the VotonExportData structure with valid pages and folders.
export function validateExportData(data: unknown): data is VotonExportData {
  if (!data || typeof data !== "object") return false;

  const d = data as VotonExportData;

  if (
    typeof d.version !== "string" ||
    typeof d.exportDate !== "string" ||
    !Array.isArray(d.pages) ||
    !Array.isArray(d.folders)
  ) {
    return false;
  }

  return (
    d.pages.every(isValidPage) &&
    d.folders.every(isValidFolder) &&
    new Set(d.pages.map((page) => page.id)).size === d.pages.length &&
    new Set(d.folders.map((folder) => folder.id)).size === d.folders.length
  );
}

function downloadFile(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  let url: string | null = null;

  try {
    url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
  } finally {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
    if (url) {
      // Let the browser begin the download before releasing its URL.
      const downloadUrl = url;
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    }
  }
}

function getExportFilename(title: string): string {
  const filename = Array.from(title)
    .filter((character) => character.charCodeAt(0) >= 32)
    .join("")
    .replace(/[<>:"/\\|?*]/g, "")
    .trim()
    .replace(/[. ]+$/, "");

  return filename &&
    !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)
    ? filename
    : "Untitled";
}

// Reads all pages and folders from the database, serializes them to JSON, and triggers a file download.
export async function exportData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["pages", "folders"], "readonly");
  const [pages, folders] = await Promise.all([
    tx.objectStore("pages").getAll(),
    tx.objectStore("folders").getAll(),
    tx.done,
  ]);
  const exportTimestamp = new Date().toISOString();
  const exportDate = exportTimestamp.split("T")[0];

  const votonData: VotonExportData = {
    version: EXPORT_VERSION,
    exportDate: exportTimestamp,
    pages,
    folders,
  };

  downloadFile(
    new Blob([JSON.stringify(votonData, null, 2)], {
      type: "application/json",
    }),
    `voton-export-${exportDate}.json`,
  );
}

// Exports a fresh JSON snapshot of one page without its folder relationship.
export async function exportPage(id: string): Promise<void> {
  const page = await getPage(id);
  if (!page) throw new Error("Page does not exist");

  const standalonePage = { ...page };
  delete standalonePage.parentFolder;
  // Optional properties cleared by the UI may still exist as undefined in IndexedDB.
  for (const prop of OPTIONAL_PAGE_PROPS) {
    if (standalonePage[prop] === undefined) delete standalonePage[prop];
  }
  if (!isValidPage(standalonePage)) throw new Error("Invalid page data");
  await validateEditorContent(standalonePage.content);

  const filename = getExportFilename(standalonePage.title);
  const data: VotonExportData = {
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    pages: [standalonePage],
    folders: [],
  };
  downloadFile(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `${filename}.json`,
  );
}

// Merge and validate against the current local data under the same write lock.
export async function importJsonData(data: unknown): Promise<void> {
  if (!validateExportData(data)) {
    throw new Error("Invalid export file format");
  }

  // Parse and validate content before opening a transaction; dynamic imports may yield.
  for (const page of data.pages) await validateEditorContent(page.content);

  await runWriteTransaction(async (tx) => {
    const pagesStore = tx.objectStore("pages");
    const foldersStore = tx.objectStore("folders");
    const [existingPages, existingFolders] = await Promise.all([
      pagesStore.getAll(),
      foldersStore.getAll(),
    ]);
    const pages = new Map(existingPages.map((page) => [page.id, page]));
    const folders = new Map(
      existingFolders.map((folder) => [folder.id, folder]),
    );
    const pagesToWrite: Page[] = [];
    const pagesToValidate: Page[] = [];
    const changedFolderIds: string[] = [];

    for (const page of data.pages) {
      const existing = pages.get(page.id);
      if (
        !existing ||
        (page.updatedAt !== undefined &&
          existing.updatedAt !== undefined &&
          page.updatedAt > existing.updatedAt)
      ) {
        pages.set(page.id, page);
        pagesToWrite.push(page);
        if (!existing || existing.parentFolder !== page.parentFolder) {
          pagesToValidate.push(page);
        }
      }
    }

    for (const folder of data.folders) {
      const existing = folders.get(folder.id);
      if (!existing || existing.parentFolder !== folder.parentFolder) {
        changedFolderIds.push(folder.id);
      }
      folders.set(folder.id, folder);
    }
    validateHierarchy(pagesToValidate, folders, changedFolderIds);

    for (const page of pagesToWrite) await pagesStore.put(page);
    for (const folder of data.folders) await foldersStore.put(folder);
  });

  notifyChanges();
}

// Parses a JSON file and passes it to the atomic workspace import.
async function processJsonFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;

        if (!jsonString) {
          throw new Error("File is empty or could not be read.");
        }

        await importJsonData(JSON.parse(jsonString));
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Reads a Markdown file and creates a new page with the filename as title and file content as content.
async function processMarkdownFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const markdownContent = e.target?.result as string;

        if (!markdownContent) {
          throw new Error("File is empty or could not be read.");
        }

        const title = file.name.slice(0, file.name.lastIndexOf("."));

        const content = prepareMarkdownContent(markdownContent);
        await validateEditorContent(content);
        await addPage({ title, content });
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// Opens a file picker and imports a JSON export or creates a page from Markdown.
export async function importData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_FILE_TYPES;
    input.multiple = false;
    input.style.display = "none";

    const cleanup = () => {
      window.removeEventListener("focus", onWindowFocus);
      if (input.parentNode) {
        document.body.removeChild(input);
      }
    };

    const onWindowFocus = () => {
      setTimeout(() => {
        if (input.files && input.files.length === 0) {
          cleanup();
          reject(new Error("No file selected"));
        }
      }, 300);
    };

    window.addEventListener("focus", onWindowFocus);

    input.onchange = async (event) => {
      cleanup();

      try {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
          reject(new Error("No file selected"));
          return;
        }

        if (file.name.endsWith(".json")) {
          await processJsonFile(file);
          resolve();
          return;
        }

        if (file.name.endsWith(".md")) {
          await processMarkdownFile(file);
          resolve();
          return;
        }

        reject(
          new Error("Invalid file format. Please select a .json or .md file"),
        );
      } catch (error) {
        reject(error);
      }
    };

    document.body.appendChild(input);
    input.click();
  });
}

// Deletes all pages and folders from the database and dispatches a delete notification.
export async function clearAllData(): Promise<void> {
  await runWriteTransaction(async (tx) => {
    await tx.objectStore("pages").clear();
    await tx.objectStore("folders").clear();
  });
  notifyDelete();
}
