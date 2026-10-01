"use client";

import { CirclePlus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useIsMac } from "@/hooks/use-is-mac";
import { addPage } from "@/lib/database/documents";

const LOGO_SRC = "/logo.svg";
const LOGO_SRC_DARK = "/logo-dark.svg";
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

  return (
    <div className="flex h-screen flex-col items-center justify-center truncate text-center">
      <Image
        src={LOGO_SRC}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        alt="Logo"
        className="dark:hidden"
      />
      <Image
        src={LOGO_SRC_DARK}
        width={LOGO_SIZE}
        height={LOGO_SIZE}
        alt="Logo"
        className="hidden dark:block"
      />

      <h1 className="text-2xl font-bold">Welcome to Voton!</h1>
      <h3 className="text-lg font-medium">What&apos;s on your mind today?</h3>

      <Button onClick={onCreate} size="lg" className="mt-4 mb-6 cursor-pointer">
        <CirclePlus />
        Create a page
      </Button>

      <div className="flex flex-col items-center gap-2 text-xs font-medium text-muted-foreground pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <span>Show/Hide sidebar</span>
          <kbd className="flex items-center px-2 font-mono border bg-secondary rounded-sm">
            {isMac ? "⌘ + \\" : "Ctrl + \\"}
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <span>Create new page</span>
          <kbd className="flex items-center px-2 font-mono border bg-secondary rounded-sm">
            {isMac ? "⌘ + ⌥ + P" : "Ctrl + Alt + P"}
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <span>Toggle focus mode</span>
          <kbd className="flex items-center px-2 font-mono border bg-secondary rounded-sm">
            {isMac ? "⌘ + ⌥ + F" : "Ctrl + Alt + F"}
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
