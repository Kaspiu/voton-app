import { getDB, runWriteTransaction } from "./database";
import { validateParentFolder } from "./hierarchy";
import { Folder, Page } from "./types";

// Generates a unique page ID using a timestamp and random suffix.
export function generatePageId(): string {
  return `page_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Existing IDs remain valid; new IDs do not depend on clock precision.
export function generateFolderId(): string {
  const suffix = Array.from(
    crypto.getRandomValues(new Uint32Array(4)),
    (part) => part.toString(16).padStart(8, "0"),
  ).join("");
  return `folder_${suffix}`;
}

// Dispatches a custom event on window to signal that an item was created or updated.
export const notifyChanges = (): void => {
  window.dispatchEvent(new CustomEvent("item-changed"));
};

// Dispatches a custom event on window to signal that an item was deleted.
export const notifyDelete = (): void => {
  window.dispatchEvent(new CustomEvent("item-deleted"));
};

// Adds a new page to the database and returns the created page.
export async function addPage(page: Omit<Page, "id">): Promise<Page> {
  const newPage: Page = {
    id: generatePageId(),
    ...page,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await runWriteTransaction(async (tx) => {
    await validateParentFolder(tx, newPage.parentFolder);
    await tx.objectStore("pages").add(newPage);
  });
  notifyChanges();
  return newPage;
}

// Copies the latest saved page within the same folder, leaving the original intact.
export async function duplicatePage(id: string): Promise<Page> {
  const copy = await runWriteTransaction(async (tx) => {
    const store = tx.objectStore("pages");
    const original = await store.get(id);
    if (!original) throw new Error("Page does not exist");

    const now = Date.now();
    const copy: Page = {
      ...original,
      id: generatePageId(),
      title: `${original.title} (copy)`,
      createdAt: now,
      updatedAt: now,
    };

    await validateParentFolder(tx, copy.parentFolder);
    await store.add(copy);
    return copy;
  });

  notifyChanges();
  return copy;
}

// Adds a new folder to the database and returns the created folder.
export async function addFolder(folder: Omit<Folder, "id">): Promise<Folder> {
  const newFolder: Folder = {
    id: generateFolderId(),
    ...folder,
  };

  await runWriteTransaction(async (tx) => {
    await validateParentFolder(tx, newFolder.parentFolder, newFolder.id);
    await tx.objectStore("folders").add(newFolder);
  });
  notifyChanges();
  return newFolder;
}

// Returns a page by ID, or undefined if not found.
export async function getPage(id: string): Promise<Page | undefined> {
  const db = await getDB();
  return db.get("pages", id);
}

// Returns a folder by ID, or undefined if not found.
export async function getFolder(id: string): Promise<Folder | undefined> {
  const db = await getDB();
  return db.get("folders", id);
}

// Returns all pages in the database.
export async function getAllPages(): Promise<Page[]> {
  const db = await getDB();
  return db.getAll("pages");
}

// Returns all folders in the database.
export async function getAllFolders(): Promise<Folder[]> {
  const db = await getDB();
  return db.getAll("folders");
}

// Returns all pages that have no parent folder.
export async function getRootPages(): Promise<Page[]> {
  const pages = await getAllPages();
  return pages.filter((page) => !page.parentFolder);
}

// Returns all folders that have no parent folder.
export async function getRootFolders(): Promise<Folder[]> {
  const folders = await getAllFolders();
  return folders.filter((folder) => !folder.parentFolder);
}

// Returns all pages whose parentFolder matches the given ID.
export async function getChildPages(parentId: string): Promise<Page[]> {
  const db = await getDB();
  const tx = db.transaction("pages", "readonly");
  return tx.store.index("parentFolder").getAll(parentId);
}

// Returns all folders whose parentFolder matches the given ID.
export async function getChildFolders(parentId: string): Promise<Folder[]> {
  const db = await getDB();
  const tx = db.transaction("folders", "readonly");
  return tx.store.index("parentFolder").getAll(parentId);
}

// Merges updates into an existing page, refreshes updatedAt, and persists it. Returns null if not found.
export async function updatePage(
  id: string,
  updates: Partial<Omit<Page, "id">>,
): Promise<Page | null> {
  const updatedPage = await runWriteTransaction(async (tx) => {
    const store = tx.objectStore("pages");
    const existingPage = await store.get(id);

    if (!existingPage) return null;

    const updatedPage: Page = {
      ...existingPage,
      ...updates,
      id,
      updatedAt: Date.now(),
    };

    // Keep legacy records editable; validate the hierarchy when the parent changes.
    if (updatedPage.parentFolder !== existingPage.parentFolder) {
      await validateParentFolder(tx, updatedPage.parentFolder);
    }
    await store.put(updatedPage);
    return updatedPage;
  });

  if (updatedPage) notifyChanges();
  return updatedPage;
}

// Merges updates into an existing folder and persists it. Returns null if not found.
export async function updateFolder(
  id: string,
  updates: Partial<Omit<Folder, "id">>,
): Promise<Folder | null> {
  const updatedFolder = await runWriteTransaction(async (tx) => {
    const store = tx.objectStore("folders");
    const existingFolder = await store.get(id);

    if (!existingFolder) return null;

    const updatedFolder: Folder = { ...existingFolder, ...updates, id };

    if (updatedFolder.parentFolder !== existingFolder.parentFolder) {
      await validateParentFolder(tx, updatedFolder.parentFolder, id);
    }
    await store.put(updatedFolder);
    return updatedFolder;
  });

  if (updatedFolder) notifyChanges();
  return updatedFolder;
}

// Deletes a page by ID. Returns false if not found.
export async function deletePage(id: string): Promise<boolean> {
  const deleted = await runWriteTransaction(async (tx) => {
    const store = tx.objectStore("pages");
    if (!(await store.get(id))) return false;

    await store.delete(id);
    return true;
  });

  if (deleted) notifyDelete();
  return deleted;
}

// Deletes the entire subtree atomically, even if legacy data contains a cycle.
export async function deleteFolderWithChildren(id: string): Promise<boolean> {
  const deleted = await runWriteTransaction(async (tx) => {
    const folders = tx.objectStore("folders");
    const pages = tx.objectStore("pages");
    if (!(await folders.get(id))) return false;

    const pending = [id];
    const visited = new Set<string>();

    while (pending.length) {
      const folderId = pending.pop()!;
      if (visited.has(folderId)) continue;
      visited.add(folderId);

      const [childFolders, childPages] = await Promise.all([
        folders.index("parentFolder").getAllKeys(folderId),
        pages.index("parentFolder").getAllKeys(folderId),
      ]);
      for (const childId of childFolders) pending.push(childId);

      for (const pageId of childPages) await pages.delete(pageId);
      await folders.delete(folderId);
    }

    return true;
  });

  if (deleted) notifyDelete();
  return deleted;
}
