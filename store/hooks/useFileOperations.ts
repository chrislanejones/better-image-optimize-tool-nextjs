// store/hooks/useFileOperations.ts
import { useCallback } from "react";
import { useImageActions } from "../useImageStore";

export const useFileOperations = () => {
  const actions = useImageActions();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isNew: true,
      }));

      actions.addImages(newImages);
    },
    [actions]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      actions.setIsDragging(true);
    },
    [actions]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      actions.setIsDragging(true);
    },
    [actions]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      actions.setIsDragging(false);
    },
    [actions]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      actions.setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const newImages = Array.from(e.dataTransfer.files).map((file) => ({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        }));

        actions.addImages(newImages);
      }
    },
    [actions]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const newImages = Array.from(e.clipboardData.files).map((file) => ({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        }));

        actions.addImages(newImages);
      }
    },
    [actions]
  );

  return {
    handleFileChange,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
  };
};
