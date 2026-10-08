"use client";

import { FilePlus, FolderPlus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsMac } from "@/hooks/use-is-mac";
import { addFolder, addPage } from "@/lib/database/documents";
import logo from "@/public/logo.svg";
import logoDark from "@/public/logo-dark.svg";

const LOGO_SIZE = 100;

const DocumentsPage = () => {
  const router = useRouter();
  const isMac = useIsMac();

  // Creates a new untitled page, navigates to it on success, and shows a toast for each state.
  const onCreate = () => {
    const promise = addPage({ title: "Untitled" }).then((page) => {
      if (page) router.push(`/documents/${page.id}`);
    });

    toast.promise(promise, {
      loading: "Creating a new page...",
      success: "New page created!",
      error: "Failed to create a new page.",
    });
  };

  // Creates a new folder in the workspace and shows a toast for each state.
  const onCreateFolder = () => {
    const promise = addFolder({ title: "New folder" });

    toast.promise(promise, {
      loading: "Creating a new folder...",
      success: "New folder created!",
      error: "Failed to create a new folder.",
    });
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center truncate text-center">
      <Image
        src={logo}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src={logoDark}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        alt="Logo"
        className="hidden dark:block"
      />

      <h1 className="text-2xl font-bold">Welcome to Voton!</h1>
      <h3 className="text-lg font-medium">What&apos;s on your mind today?</h3>

      <div className="my-4 flex flex-wrap items-start justify-center gap-4 px-4">
        <Button
          onClick={onCreate}
          variant="outline"
          size="lg"
          className="cursor-pointer"
        >
          <FilePlus />
          Create a page
        </Button>
        <Button
          onClick={onCreateFolder}
          variant="outline"
          size="lg"
          className="cursor-pointer"
        >
          <FolderPlus />
          Create a folder
        </Button>
      </div>

      <div className="pointer-events-none flex select-none flex-wrap items-center justify-center gap-2 px-4 text-xs font-medium text-muted-foreground">
        <span>Show all shortcuts</span>
        <div className="flex items-center gap-1">
          <kbd className="flex items-center rounded-sm border bg-secondary px-2 font-mono">
            {isMac ? "⌘" : "Ctrl"}
          </kbd>
          <span>+</span>
          <kbd className="flex items-center rounded-sm border bg-secondary px-2 font-mono">
            {isMac ? "⌥" : "Alt"}
          </kbd>
          <span>+</span>
          <kbd className="flex items-center rounded-sm border bg-secondary px-2 font-mono">
            /
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
