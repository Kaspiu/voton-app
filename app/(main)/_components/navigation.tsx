"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronsLeft,
  CirclePlus,
  FileText,
  Folder,
  Menu,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "usehooks-ts";

import { Logo } from "@/components/logo";
import { SidebarItem } from "@/components/sidebar-item";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearch } from "@/hooks/use-search";
import { useFocusMode } from "@/hooks/use-focus-mode";
import { useSettings } from "@/hooks/use-settings";
import { useSidebar } from "@/hooks/use-sidebar";
import { addFolder, addPage, getPage } from "@/lib/database/documents";
import { cn } from "@/lib/utils";

import { DocumentsList } from "./documents-list";
import { Navbar } from "./navbar";

const DEFAULT_SIDEBAR_WIDTH = 288;
const MIN_SIDEBAR_WIDTH = 288;
const MAX_SIDEBAR_WIDTH = 448;

const SIDEBAR_TOGGLE_KEY = "\\";
const NEW_PAGE_KEY = "p";
const FOCUS_MODE_KEY = "f";

const Navigation = () => {
  const pathName = usePathname();
  const params = useParams();
  const documentId = params.documentId as string | undefined;
  const router = useRouter();
  // initializeWithValue: false prevents hydration mismatch.
  const isMobile = useMediaQuery("(max-width: 1024px)", {
    initializeWithValue: false,
  });
  const onSearchOpen = useSearch((state) => state.onOpen);
  const onSettingsOpen = useSettings((state) => state.onOpen);
  const toggleFocusMode = useFocusMode((state) => state.toggleFocusMode);
  const isFocusMode = useFocusMode((state) => state.isFocusMode);
  const isCollapsed = useSidebar((state) => state.isCollapsed);
  const onCollapse = useSidebar((state) => state.onCollapse);
  const onExpand = useSidebar((state) => state.onExpand);

  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const isFocusCollapsed = useRef(false);

  const [isResetting, setIsResetting] = useState(false);
  const [isDocumentFound, setIsDocumentFound] = useState(true);

  // Sets sidebar width and adjusts the navbar position directly in the DOM, skipping React state.
  const applySidebarStyles = useCallback((sidebarWidth: string) => {
    if (!sidebarRef.current || !navbarRef.current) return;
    sidebarRef.current.style.width = sidebarWidth;
    navbarRef.current.style.left = sidebarWidth;
    navbarRef.current.style.width = `calc(100% - ${sidebarWidth})`;
  }, []);

  // Hides the sidebar instantly without animation — safe to call inside useEffect bodies.
  const collapseDOM = useCallback(() => {
    onCollapse();
    applySidebarStyles("0px");
  }, [onCollapse, applySidebarStyles]);

  // Hides the sidebar with a slide-out animation — call only from event handlers.
  const collapseSidebar = useCallback(() => {
    setIsResetting(true);
    collapseDOM();
    setTimeout(() => setIsResetting(false), 300);
  }, [collapseDOM]);

  // Expands the sidebar to DEFAULT_SIDEBAR_WIDTH with a slide-in animation.
  const resetSidebarWidth = useCallback(() => {
    onExpand();
    setIsResetting(true);

    if (isMobile) {
      applySidebarStyles("100%");
    } else {
      applySidebarStyles(`${DEFAULT_SIDEBAR_WIDTH}px`);
    }

    setTimeout(() => setIsResetting(false), 300);
  }, [isMobile, onExpand, applySidebarStyles]);

  // Starts the resize drag and registers scoped move/up listeners that clean up after themselves.
  const handleSidebarResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;

      const onMouseMove = (event: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = Math.min(
          Math.max(event.clientX, MIN_SIDEBAR_WIDTH),
          MAX_SIDEBAR_WIDTH,
        );
        applySidebarStyles(`${newWidth}px`);
      };

      // Defined after onMouseMove so both can reference each other without TDZ issues.
      const onMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [applySidebarStyles],
  );

  // Creates a new untitled page and navigates to it.
  const onCreatePage = useCallback(() => {
    const promise = addPage({ title: "Untitled" }).then((page) => {
      if (page) router.push(`/documents/${page.id}`);
    });

    toast.promise(promise, {
      loading: "Creating a new page...",
      success: "New page created!",
      error: "Failed to create a new page.",
    });
  }, [router]);

  // Creates a new folder in the workspace.
  const onCreateFolder = () => {
    const promise = addFolder({ title: "New folder" });

    toast.promise(promise, {
      loading: "Creating a new folder...",
      success: "New folder created!",
      error: "Failed to create a new folder.",
    });
  };

  // On mobile: collapses sidebar instantly. On desktop: sets default width.
  useEffect(() => {
    if (isMobile) {
      collapseDOM();
      return;
    }

    onExpand();
    applySidebarStyles(`${DEFAULT_SIDEBAR_WIDTH}px`);
  }, [isMobile, collapseDOM, onExpand, applySidebarStyles]);

  // Closes the sidebar on every route change on mobile.
  useEffect(() => {
    if (isMobile) collapseDOM();
  }, [isMobile, pathName, collapseDOM]);

  // Checks if the current document exists to decide which navbar variant to render.
  useEffect(() => {
    const checkDocument = async () => {
      setIsDocumentFound(true);
      if (documentId) {
        const page = await getPage(documentId);
        setIsDocumentFound(!!page);
      }
    };
    checkDocument();
  }, [documentId]);

  // Collapses sidebar when focus mode is turned on and inside a document page, restores it otherwise.
  useEffect(() => {
    if (isMobile) return;

    const shouldCollapse = isFocusMode && documentId;

    if (shouldCollapse && !isFocusCollapsed.current) {
      collapseSidebar();
      isFocusCollapsed.current = true;
    } else if (!shouldCollapse && isFocusCollapsed.current) {
      resetSidebarWidth();
      isFocusCollapsed.current = false;
    }
  }, [isFocusMode, documentId, isMobile, collapseSidebar, resetSidebarWidth]);

  // Handle keyboard shortcuts for sidebar toggle, new page, and focus mode.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === SIDEBAR_TOGGLE_KEY && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isCollapsed) {
          resetSidebarWidth();
        } else {
          collapseSidebar();
        }
      }
      if (e.key === NEW_PAGE_KEY && (e.ctrlKey || e.metaKey) && e.altKey) {
        e.preventDefault();
        onCreatePage();
      }
      if (e.key === FOCUS_MODE_KEY && (e.ctrlKey || e.metaKey) && e.altKey) {
        e.preventDefault();
        toggleFocusMode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isCollapsed,
    collapseSidebar,
    resetSidebarWidth,
    onCreatePage,
    toggleFocusMode,
  ]);

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/aside relative z-50 flex h-screen w-72 flex-col overflow-x-hidden overflow-y-auto bg-secondary text-muted-foreground",
          isResetting && "transition-all duration-200",
          isMobile && "w-0",
        )}
      >
        <div className="flex items-center justify-between px-3 pt-4">
          <Link href="/documents" className="shrink-0 select-none">
            <Logo size="sm" className="text-primary" />
          </Link>
          <div
            onClick={collapseSidebar}
            role="button"
            className="flex cursor-pointer items-center justify-center rounded-md p-[3px] transition-all hover:bg-muted-foreground/10"
          >
            <ChevronsLeft className="h-6 w-6" />
          </div>
        </div>

        <div className="flex w-full flex-col py-4">
          <SidebarItem
            onClick={onSearchOpen}
            icon={Search}
            label="Search"
            isSearch
          />
          <SidebarItem
            onClick={onSettingsOpen}
            icon={Settings}
            label="Settings"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div
                role="button"
                className="group mx-1 flex h-8 cursor-pointer items-center rounded-sm py-1 text-sm font-medium transition-all hover:bg-muted-foreground/10 data-[state=open]:bg-muted-foreground/10"
              >
                <CirclePlus className="ml-3.5 mr-2 size-4 shrink-0" />
                <span className="mr-2 truncate">Add</span>
                <ChevronRight
                  className={cn(
                    "ml-auto mr-2 size-4 shrink-0 transition-all",
                    isMobile && "group-data-[state=open]:rotate-90",
                  )}
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={isMobile ? "end" : "start"}
              side={isMobile ? "bottom" : "right"}
            >
              <DropdownMenuItem onClick={onCreatePage}>
                <FileText className="h-4 w-4 shrink-0" /> New page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateFolder}>
                <Folder className="h-4 w-4 shrink-0" /> New folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="pl-4.5 pr-3 text-sm font-semibold text-muted-foreground/50">
          Workspace
        </p>

        <div className="truncate overflow-y-auto mt-2 pb-2 doc-list-scroll">
          <DocumentsList />
        </div>

        <div
          onClick={!isMobile ? resetSidebarWidth : undefined}
          onMouseDown={!isMobile ? handleSidebarResize : undefined}
          className="absolute top-0 right-0 h-full w-[3px] cursor-ew-resize bg-muted-foreground/10 opacity-0 transition-all group-hover/aside:opacity-100"
        />
      </aside>

      <div
        ref={navbarRef}
        className={cn(
          "fixed top-0 left-72 z-50 w-[calc(100%-288px)]",
          isResetting && "transition-all duration-200",
          isMobile && "left-0 w-full",
          !isMobile &&
            isCollapsed &&
            isFocusMode &&
            documentId &&
            "opacity-0 hover:opacity-100 has-data-[state=open]:opacity-100 transition-all duration-200",
        )}
      >
        {documentId && isDocumentFound ? (
          <Navbar isCollapsed={isCollapsed} onResetWidth={resetSidebarWidth} />
        ) : (
          <nav className="w-full p-4 pt-6">
            {isCollapsed && (
              <div
                onClick={resetSidebarWidth}
                role="button"
                className="flex h-fit w-fit cursor-pointer items-center justify-center rounded-md p-[3px] text-muted-foreground transition-all hover:bg-muted-foreground/10"
              >
                <Menu className="h-6 w-6" />
              </div>
            )}
          </nav>
        )}
      </div>
    </>
  );
};

export default Navigation;
