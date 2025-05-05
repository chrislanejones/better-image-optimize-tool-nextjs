// store/hooks/useImageControls.ts
import { useCallback } from "react";
import { useImageStore, useImageActions } from "../useImageStore";

export const useImageControls = () => {
  const actions = useImageActions();
  const { selectedImage, previewUrl } = useImageStore();

  const toggleEditMode = useCallback(() => {
    actions.setIsEditMode(!useImageStore.getState().isEditMode);
  }, [actions]);

  const toggleCropping = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsCropping(!state.isCropping);
    actions.setIsBlurring(false);
    actions.setIsPainting(false);
  }, [actions]);

  const toggleBlurring = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsBlurring(!state.isBlurring);
    actions.setIsCropping(false);
    actions.setIsPainting(false);
  }, [actions]);

  const togglePainting = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsPainting(!state.isPainting);
    actions.setIsCropping(false);
    actions.setIsBlurring(false);
  }, [actions]);

  const zoomIn = useCallback(() => {
    const currentZoom = useImageStore.getState().zoom;
    actions.setZoom(Math.min(currentZoom + 0.1, 3));
  }, [actions]);

  const zoomOut = useCallback(() => {
    const currentZoom = useImageStore.getState().zoom;
    actions.setZoom(Math.max(currentZoom - 0.1, 0.5));
  }, [actions]);

  const resetImage = useCallback(() => {
    if (previewUrl && previewUrl !== selectedImage?.url) {
      URL.revokeObjectURL(previewUrl);
    }
    actions.resetEditor();
  }, [actions, previewUrl, selectedImage?.url]);

  return {
    toggleEditMode,
    toggleCropping,
    toggleBlurring,
    togglePainting,
    zoomIn,
    zoomOut,
    resetImage,
  };
};

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
      if (!useImageStore.getState().isDragging) {
        actions.setIsDragging(true);
      }
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

// store/hooks/useImageProcessing.ts
import { useCallback } from "react";
import { useImageStore, useImageActions } from "../useImageStore";
import { PixelCrop } from "react-image-crop";
import {
  cropImage,
  resizeImage,
  getMimeType,
  calculateSizeReduction,
} from "../../utils/image-utils";

export const useImageProcessing = () => {
  const actions = useImageActions();
  const { selectedImage, format } = useImageStore();

  const handleCropComplete = useCallback(
    async (crop: PixelCrop, imgElement: HTMLImageElement) => {
      try {
        const croppedUrl = await cropImage(imgElement, crop, format as any);

        actions.setWidth(crop.width);
        actions.setHeight(crop.height);
        actions.setPreviewUrl(croppedUrl);
        actions.setHasEdited(true);

        // Fetch blob for stats
        const blob = await fetch(croppedUrl).then((r) => r.blob());

        actions.setNewStats({
          width: crop.width,
          height: crop.height,
          size: blob.size,
          format: format,
        });

        const state = useImageStore.getState();
        if (state.originalStats) {
          const savings = calculateSizeReduction(
            state.originalStats.size,
            blob.size
          );
          actions.setDataSavings(savings);
        }
      } catch (error) {
        console.error("Error cropping image:", error);
      }
    },
    [actions, format]
  );

  const handleResizeApply = useCallback(async () => {
    const state = useImageStore.getState();
    if (!state.selectedImage || !state.imageRef?.current) return;

    try {
      const resizedUrl = await resizeImage(
        state.imageRef.current,
        state.width,
        state.height,
        state.format as any
      );

      actions.setPreviewUrl(resizedUrl);
      actions.setHasEdited(true);

      const blob = await fetch(resizedUrl).then((r) => r.blob());

      actions.setNewStats({
        width: state.width,
        height: state.height,
        size: blob.size,
        format: state.format,
      });

      if (state.originalStats) {
        const savings = calculateSizeReduction(
          state.originalStats.size,
          blob.size
        );
        actions.setDataSavings(savings);
      }
    } catch (error) {
      console.error("Error resizing image:", error);
    }
  }, [actions]);

  const downloadImage = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.canvasRef?.current || !state.selectedImage?.file?.name) return;

    const canvas = state.canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || !state.imageRef?.current) return;

    canvas.width = state.imageRef.current.naturalWidth;
    canvas.height = state.imageRef.current.naturalHeight;
    ctx.drawImage(state.imageRef.current, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const fileName =
            state.selectedImage!.file.name.split(".")[0] || "image";
          a.download = `${fileName}-edited.${
            state.format === "webp"
              ? "webp"
              : state.format === "jpeg"
              ? "jpg"
              : "png"
          }`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      getMimeType(state.format),
      0.9
    );
  }, []);

  return {
    handleCropComplete,
    handleResizeApply,
    downloadImage,
  };
};

// store/hooks/useImageNavigation.ts
export const useImageNavigation = () => {
  const images = useImageStore((state) => state.images);
  const selectedImage = useImageStore((state) => state.selectedImage);
  const actions = useImageActions();

  const getNavigationInfo = useCallback(() => {
    if (!selectedImage || !images.length) return null;

    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    return {
      currentIndex,
      hasPrevious,
      hasNext,
      total: images.length,
    };
  }, [images, selectedImage]);

  const navigateToPrevious = useCallback(() => {
    const info = getNavigationInfo();
    if (!info?.hasPrevious) return;

    const previousImage = images[info.currentIndex - 1];
    actions.selectImage(previousImage);
  }, [images, getNavigationInfo, actions]);

  const navigateToNext = useCallback(() => {
    const info = getNavigationInfo();
    if (!info?.hasNext) return;

    const nextImage = images[info.currentIndex + 1];
    actions.selectImage(nextImage);
  }, [images, getNavigationInfo, actions]);

  return {
    getNavigationInfo,
    navigateToPrevious,
    navigateToNext,
  };
};
