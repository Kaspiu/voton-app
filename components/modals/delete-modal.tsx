"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteModalProps {
  children: React.ReactNode;
  onDelete: () => void;
  name: string;
  isFolder?: boolean;
}

export const DeleteModal = ({
  children,
  onDelete,
  name,
  isFolder,
}: DeleteModalProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger onClick={(e) => e.stopPropagation()} asChild>
        {children}
      </AlertDialogTrigger>

      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isFolder ? "folder" : "page"} “{name}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isFolder
              ? "This folder and all pages and nested folders inside it will be permanently deleted. This cannot be undone."
              : "This page and its content will be permanently deleted. This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            variant="destructive"
            className="cursor-pointer"
          >
            Delete {isFolder ? "folder" : "page"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
