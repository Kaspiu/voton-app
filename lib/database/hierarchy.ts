import type { WriteTransaction } from "./database";
import type { Folder, Page } from "./types";

// Validate the full parent chain while holding the transaction's write lock.
export async function validateParentFolder(
  tx: WriteTransaction,
  parentId: string | undefined,
  folderId?: string,
): Promise<void> {
  const visited = new Set<string>(folderId === undefined ? [] : [folderId]);

  while (parentId) {
    if (visited.has(parentId)) {
      throw new Error("Folder hierarchy cannot contain cycles");
    }
    visited.add(parentId);

    const parent = await tx.objectStore("folders").get(parentId);
    if (!parent) {
      throw new Error("Parent folder does not exist");
    }
    parentId = parent.parentFolder;
  }
}

// Check changed relationships against the merged graph, leaving unrelated legacy data intact.
export function validateHierarchy(
  pages: Iterable<Page>,
  folders: ReadonlyMap<string, Folder>,
  changedFolderIds: Iterable<string>,
): void {
  const validated = new Set<string>();

  const validateChain = (startId: string | undefined) => {
    const path = new Set<string>();
    let id = startId;

    while (id && !validated.has(id)) {
      if (path.has(id)) {
        throw new Error("Folder hierarchy cannot contain cycles");
      }
      path.add(id);

      const current = folders.get(id);
      if (!current) {
        throw new Error("Parent folder does not exist");
      }
      id = current.parentFolder;
    }

    for (const id of path) validated.add(id);
  };

  for (const id of changedFolderIds) validateChain(id);
  for (const page of pages) validateChain(page.parentFolder);
}
