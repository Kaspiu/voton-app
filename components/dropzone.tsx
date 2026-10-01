"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
};

const DROPZONE_ERROR_MESSAGES: Record<string, string> = {
  "file-too-large": `File size must be less than 10MB.`,
  "file-invalid-type": `Only JPEG, PNG, GIF files are allowed.`,
  "too-many-files": "Only one file is allowed.",
};

interface ImageDropzoneProps {
  onImageSelect?: (base64Url: string) => void;
  className?: string;
}

export const ImageDropzone = ({
  onImageSelect,
  className = "",
}: ImageDropzoneProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Validates dropped files, sets the preview, and fires onImageSelect with a base64 data URL.
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const errorCode = fileRejections[0].errors[0]?.code ?? "";
        const message = DROPZONE_ERROR_MESSAGES[errorCode] ?? "Invalid file.";
        toast.error(message);
        return;
      }

      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setPreviewUrl(URL.createObjectURL(file));

      if (onImageSelect) {
        const reader = new FileReader();
        reader.onloadend = () => onImageSelect(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [onImageSelect],
  );

  // Revokes the object URL on cleanup to prevent memory leaks.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_MIME_TYPES,
      maxSize: MAX_FILE_SIZE_BYTES,
      multiple: false,
    });

  return (
    <div className={cn(className)}>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer overflow-hidden rounded-md border-2 border-dashed p-6 text-center transition-all",
          isDragActive &&
            !isDragReject &&
            "border-muted-foreground bg-muted-foreground/10",
          isDragReject && "border-destructive bg-destructive/10",
          !isDragActive && !isDragReject && "hover:border-muted-foreground",
          previewUrl && "border border-solid p-0",
        )}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Preview"
            height={500}
            width={500}
            className="h-auto w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">
                {isDragActive
                  ? "Drop image here"
                  : "Drop image here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
