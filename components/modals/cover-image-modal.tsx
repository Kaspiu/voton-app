"use client";

import { ImageDropzone } from "@/components/dropzone";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCoverImage } from "@/hooks/use-cover-image";
import { updatePage } from "@/lib/database/documents";
import { Page } from "@/lib/database/types";

interface CoverImageModalProps {
  initialData: Page;
}

export const CoverImageModal = ({ initialData }: CoverImageModalProps) => {
  const { isOpen, onClose } = useCoverImage();

  // Saves the selected cover image URL to the page and closes the modal.
  const onImageSelect = (base64Url: string) => {
    updatePage(initialData.id, { coverImage: base64Url });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent closeClassName="top-6 right-6">
        <DialogHeader>
          <DialogTitle>Select a cover</DialogTitle>
        </DialogHeader>
        <ImageDropzone onImageSelect={onImageSelect} />
      </DialogContent>
    </Dialog>
  );
};
