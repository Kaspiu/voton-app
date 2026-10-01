"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { notFound, useParams } from "next/navigation";

import { CoverImage } from "@/app/(main)/_components/cover";
import { Toolbar } from "@/app/(main)/_components/toolbar";
import { CoverImageModal } from "@/components/modals/cover-image-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { getPage, updatePage } from "@/lib/database/documents";
import { Page } from "@/lib/database/types";

const Editor = dynamic(() => import("@/components/editor"), { ssr: false });

const DocumentIdPage = () => {
  const [page, setPage] = useState<Page | null | undefined>(undefined);
  const params = useParams();
  const documentId = params.documentId as string;

  // Fetches the page on mount and re-fetches whenever the document is updated externally.
  useEffect(() => {
    const fetchPage = async () => {
      if (!documentId) return;
      const pageData = await getPage(documentId);
      setPage(pageData ?? null);
    };

    fetchPage();

    window.addEventListener("item-changed", fetchPage);
    return () => window.removeEventListener("item-changed", fetchPage);
  }, [documentId]);

  // Persists the current editor content to the database.
  const saveToDatabase = (content: string) => {
    if (documentId) updatePage(documentId, { content });
  };

  if (page === undefined) {
    return (
      <div className="mt-[62px]">
        <Skeleton className="h-[15vh] w-full" />
        <div className="mt-17 max-w-5xl space-y-4 pl-21">
          <Skeleton className="mb-15 h-14 w-1/4" />
          <Skeleton className="h-5 w-3/4 rounded-sm" />
          <Skeleton className="h-5 w-2/5 rounded-sm" />
          <Skeleton className="h-5 w-3/5 rounded-sm" />
          <Skeleton className="h-5 w-1/2 rounded-sm" />
        </div>
      </div>
    );
  }

  if (page === null) return notFound();

  return (
    <div className="pb-40">
      <CoverImage initialData={page} />
      <Toolbar initialData={page} />
      <Editor onChange={saveToDatabase} initialData={page.content} />
      <CoverImageModal initialData={page} />
    </div>
  );
};

export default DocumentIdPage;
