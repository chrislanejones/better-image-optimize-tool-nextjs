// store/hooks/useImageOperations.ts
import { useCallback, useRef } from "react";
import { useImageStore, useImageActions } from "../useImageStore";
import { PixelCrop } from "react-image-crop";
import { cropImage, resizeImage, getMimeType } from "../../utils/image-utils";
import { useImageStats } from "./useImageStats";
import { useImageHistoryWithStore } from "./useImageStats";

export const useImageOperations = () => {
  const {
    selectedImage,
    imageRef,
    format,
    width,
    height,
    previewUrl,
    canvasRef,
  } = useImageStore();
  const actions = useImageActions();
  const { updateStatsAfterProcessing } = useImageStats();
  const { saveState } = useImageHistoryWithStore();

  // Set up refs if they don't exist
  const imgRefInternal = useRef<HTMLImageElement | null>(null);
  const canvasRefInternal = useRef<HTMLCanvasElement | null>(null);

  const getImageRef = useCallback(() => {
    return imageRef?.current || imgRefInternal.current;
  }, [imageRef]);

  const getCanvasRef = useCallback(() => {
    return canvasRef?.current || canvasRefInternal.current;
  }, [canvasRef]);

  // Handle crop completion
  const handleCropComplete = useCallback(
    async (crop: PixelCrop, imgElement: HTMLImageElement) => {
      if (!selectedImage) return;

      try {
        saveState("crop");

        const croppedUrl = await cropImage(imgElement, crop, format as any);

        actions.setWidth(crop.width);
        actions.setHeight(crop.height);
        actions.setPreviewUrl(croppedUrl);
        actions.setIsCropping(false);
        actions.setHasEdited(true);

        await updateStatsAfterProcessing(croppedUrl);

        // If in standalone mode, update the image in the list
        const updatedImages = useImageStore
          .getState()
          .images.map((img) =>
            img.id === selectedImage.id ? { ...img, url: croppedUrl } : img
          );
        actions.setImages(updatedImages);

        // Revoke old URL if needed
        if (previewUrl && previewUrl !== selectedImage.url) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.error("Error applying crop:", error);
      }
    },
    [
      selectedImage,
      format,
      actions,
      updateStatsAfterProcessing,
      previewUrl,
      saveState,
    ]
  );

  // Handle resize
  const handleResize = useCallback(
    async (newWidth: number, newHeight: number) => {
      actions.setWidth(newWidth);
      actions.setHeight(newHeight);
    },
    [actions]
  );

  // Apply resize
  const applyResize = useCallback(async () => {
    const imgRef = getImageRef();
    if (!imgRef || !selectedImage) return;

    try {
      saveState("resize");

      const resizedUrl = await resizeImage(
        imgRef,
        width,
        height,
        format as any
      );

      actions.setPreviewUrl(resizedUrl);
      actions.setHasEdited(true);

      await updateStatsAfterProcessing(resizedUrl);

      // If in standalone mode, update the image in the list
      const updatedImages = useImageStore
        .getState()
        .images.map((img) =>
          img.id === selectedImage.id ? { ...img, url: resizedUrl } : img
        );
      actions.setImages(updatedImages);

      // Revoke old URL if needed
      if (previewUrl && previewUrl !== selectedImage.url) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error) {
      console.error("Error applying resize:", error);
    }
  }, [
    getImageRef,
    selectedImage,
    width,
    height,
    format,
    actions,
    updateStatsAfterProcessing,
    previewUrl,
    saveState,
  ]);

  // Handle blur apply
  const handleBlurApply = useCallback(
    async (blurredImageUrl: string) => {
      if (!blurredImageUrl || !selectedImage) return;

      try {
        saveState("blur");

        actions.setPreviewUrl(blurredImageUrl);
        actions.setIsBlurring(false);
        actions.setHasEdited(true);

        await updateStatsAfterProcessing(blurredImageUrl);

        // If in standalone mode, update the image in the list
        const updatedImages = useImageStore
          .getState()
          .images.map((img) =>
            img.id === selectedImage.id ? { ...img, url: blurredImageUrl } : img
          );
        actions.setImages(updatedImages);

        // Revoke old URL if needed
        if (previewUrl && previewUrl !== selectedImage.url) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.error("Error applying blur:", error);
      }
    },
    [selectedImage, actions, updateStatsAfterProcessing, previewUrl, saveState]
  );

  // Handle paint apply
  const handlePaintApply = useCallback(
    async (paintedImageUrl: string) => {
      if (!paintedImageUrl || !selectedImage) return;

      try {
        saveState("paint");

        actions.setPreviewUrl(paintedImageUrl);
        actions.setIsPainting(false);
        actions.setHasEdited(true);

        await updateStatsAfterProcessing(paintedImageUrl);

        // If in standalone mode, update the image in the list
        const updatedImages = useImageStore
          .getState()
          .images.map((img) =>
            img.id === selectedImage.id ? { ...img, url: paintedImageUrl } : img
          );
        actions.setImages(updatedImages);

        // Revoke old URL if needed
        if (previewUrl && previewUrl !== selectedImage.url) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.error("Error applying paint effect:", error);
      }
    },
    [selectedImage, actions, updateStatsAfterProcessing, previewUrl, saveState]
  );

  // Download image
  const downloadImage = useCallback(() => {
    const canvas = getCanvasRef();
    if (!canvas || !selectedImage?.file?.name) return;

    const ctx = canvas.getContext("2d");
    const imgRef = getImageRef();

    if (!ctx || !imgRef) return;

    // Get the current image dimensions
    canvas.width = imgRef.naturalWidth;
    canvas.height = imgRef.naturalHeight;

    // Draw the current image to canvas
    ctx.drawImage(imgRef, 0, 0);

    // Determine file extension based on format
    const extension =
      format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png";
    const fileName = selectedImage.file.name.split(".")[0] || "image";

    // Convert to blob and trigger download
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}-edited.${extension}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      getMimeType(format),
      0.9
    );
  }, [getCanvasRef, getImageRef, selectedImage, format]);

  // Initialize on new image
  const initializeImage = useCallback(
    async (img: HTMLImageElement) => {
      if (!selectedImage) return;

      imgRefInternal.current = img;
      actions.setImageRef(imgRefInternal);

      // Set initial dimensions from the image
      actions.setWidth(img.naturalWidth);
      actions.setHeight(img.naturalHeight);

      // Initialize the canvas reference if needed
      if (!canvasRefInternal.current) {
        canvasRefInternal.current = document.createElement("canvas");
        actions.setCanvasRef(canvasRefInternal);
      }

      // Reset editing state
      actions.setHasEdited(false);
      actions.setNewStats(null);
    },
    [selectedImage, actions]
  );

  return {
    handleCropComplete,
    handleResize,
    applyResize,
    handleBlurApply,
    handlePaintApply,
    downloadImage,
    initializeImage,
    imgRef: imgRefInternal,
    canvasRef: canvasRefInternal,
  };
};
