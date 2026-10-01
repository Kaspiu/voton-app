import { DBSchema, IDBPDatabase, IDBPTransaction, openDB } from "idb";
import { toast } from "sonner";

import { Folder, Page } from "./types";

const DB_NAME = "VotonDB";
const DB_VERSION = 7;

interface VotonDBSchema extends DBSchema {
  pages: {
    key: string;
    value: Page;
    indexes: {
      parentFolder: string;
      title: string;
    };
  };
  folders: {
    key: string;
    value: Folder;
    indexes: {
      parentFolder: string;
      title: string;
    };
  };
}

type UpgradeTransaction = IDBPTransaction<
  VotonDBSchema,
  ("pages" | "folders")[],
  "versionchange"
>;

export type WriteTransaction = IDBPTransaction<
  VotonDBSchema,
  ("pages" | "folders")[],
  "readwrite"
>;

let dbPromise: Promise<IDBPDatabase<VotonDBSchema>> | null = null;

// Creates the pages and folders object stores and their indexes if they don't already exist.
function upgradeDB(
  db: IDBPDatabase<VotonDBSchema>,
  transaction: UpgradeTransaction,
): void {
  const pagesStore = db.objectStoreNames.contains("pages")
    ? transaction.objectStore("pages")
    : db.createObjectStore("pages", { keyPath: "id" });

  if (!pagesStore.indexNames.contains("parentFolder")) {
    pagesStore.createIndex("parentFolder", "parentFolder", { unique: false });
  }
  if (!pagesStore.indexNames.contains("title")) {
    pagesStore.createIndex("title", "title", { unique: false });
  }

  const foldersStore = db.objectStoreNames.contains("folders")
    ? transaction.objectStore("folders")
    : db.createObjectStore("folders", { keyPath: "id" });

  if (!foldersStore.indexNames.contains("parentFolder")) {
    foldersStore.createIndex("parentFolder", "parentFolder", { unique: false });
  }
  if (!foldersStore.indexNames.contains("title")) {
    foldersStore.createIndex("title", "title", { unique: false });
  }
}

// Opens the database, runs schema upgrades if needed, caches and returns the instance.
export async function initializeDB(): Promise<IDBPDatabase<VotonDBSchema>> {
  if (dbPromise) return dbPromise;

  let blockedToastId: string | number | undefined;
  const opening = openDB<VotonDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      upgradeDB(db, transaction as UpgradeTransaction);
    },
    blocked() {
      blockedToastId = toast.warning("Workspace update paused.", {
        description: "Close other Voton tabs to resume automatically.",
        duration: Infinity,
        dismissible: false,
      });
    },
  })
    .then((db) => {
      const invalidate = () => {
        if (dbPromise === opening) dbPromise = null;
      };
      db.addEventListener("versionchange", () => {
        db.close();
        invalidate();
      });
      db.addEventListener("close", invalidate);
      return db;
    })
    .catch((error) => {
      if (dbPromise === opening) dbPromise = null;
      throw error;
    })
    .finally(() => {
      if (blockedToastId !== undefined) toast.dismiss(blockedToastId);
    });

  dbPromise = opening;
  return opening;
}

// Returns the cached database instance, initializing it if necessary.
export function getDB(): Promise<IDBPDatabase<VotonDBSchema>> {
  return initializeDB();
}

// Keep reads, validation and writes together. Only await IndexedDB work inside the callback.
export async function runWriteTransaction<T>(
  operation: (tx: WriteTransaction) => Promise<T>,
): Promise<T> {
  const db = await getDB();
  const tx = db.transaction(["pages", "folders"], "readwrite");
  // Observe aborts immediately, even when an individual request rejects first.
  const completion = tx.done.catch(() => {});

  try {
    const result = await operation(tx);
    await tx.done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // The transaction may already have aborted or finished.
    }
    await completion;
    throw error;
  }
}
