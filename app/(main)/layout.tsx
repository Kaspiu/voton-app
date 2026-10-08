"use client";

import { useEffect, useRef } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { MoveToCommand } from "@/components/modals/move-to-command";
import { SearchCommand } from "@/components/modals/search-command";
import { SettingsModal } from "@/components/modals/settings-modal";
import { ShortcutsModal } from "@/components/modals/shortcuts-modal";
import { Toaster } from "@/components/ui/sonner";
import { useSettings } from "@/hooks/use-settings";
import { getPage } from "@/lib/database/documents";
import Navigation from "./_components/navigation";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const params = useParams();
  const documentId =
    typeof params.documentId === "string" ? params.documentId : undefined;
  const pathname = usePathname();
  const router = useRouter();
  const hasCheckedRestore = useRef(false);
  const loadPreferences = useSettings((state) => state.loadPreferences);
  const rememberPage = useSettings((state) => state.rememberPage);
  const clearLastPage = useSettings((state) => state.clearLastPage);

  useEffect(() => {
    loadPreferences();
    if (documentId) rememberPage(documentId);

    // Only restore on entry, so Back and Close can keep the workspace home open.
    if (hasCheckedRestore.current) return;
    if (pathname !== "/documents") {
      hasCheckedRestore.current = true;
      return;
    }

    const { restoreLastPage, lastPageId } = useSettings.getState();
    if (!restoreLastPage || !lastPageId) {
      hasCheckedRestore.current = true;
      return;
    }

    let cancelled = false;
    getPage(lastPageId)
      .then((page) => {
        if (cancelled) return;
        hasCheckedRestore.current = true;

        const preferences = useSettings.getState();
        if (
          !preferences.restoreLastPage ||
          preferences.lastPageId !== lastPageId
        ) return;

        if (page) {
          router.replace(`/documents/${encodeURIComponent(page.id)}`);
        } else {
          clearLastPage();
        }
      })
      .catch((error) => {
        if (cancelled) return;
        hasCheckedRestore.current = true;
        console.error("Failed to restore the last opened page:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [documentId, pathname, router, loadPreferences, rememberPage, clearLastPage]);

  useEffect(() => {
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return (
    <div className="flex h-dvh bg-background dark:bg-[#1F1F1F]">
      <Navigation />
      <SearchCommand />
      <SettingsModal />
      <MoveToCommand />
      <ShortcutsModal />

      <main className="h-full flex-1 overflow-y-auto will-change-scroll">
        {children}
      </main>

      <Toaster position="bottom-center" />
    </div>
  );
};

export default MainLayout;
