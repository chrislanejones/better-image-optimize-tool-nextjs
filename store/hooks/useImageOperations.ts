// store/hooks/useImageOperations.ts
import { useCallback, useRef } from "react";
import { useImageStore } from "../useImageStore";
import { useImageActions } from "../useImageActions";
import { PixelCrop } from "react-image-crop";
import { useImageStats } from "./useImageStats";
import { useImageHistoryWithStore } from "./useImageStats";

/**
 * Custom hook for image processing operations
 * Provides functions for various image operations like crop, resize, blur, etc.
 */
export const useImageOperations = () => {
  // Get required state from store
  const selectedImage = useImageStore((state) => state.selectedImage);
  const imageRef = useImageStore((state) => state.imageRef);
  const format = useImageStore((state) => state.format);
  const width = useImageStore((state) => state.width);
  const height = useImageStore((state) => state.height);
  const previewUrl = useImageStore((state) => state.previewUrl);
  const canvasRef = useImageStore((state) => state.canvasRef);

  // Get actions
  const actions = useImageActions();

  // Get stats and history hooks
  const { updateStatsAfterProcessing } = useImageStats();
  const { saveState } = useImageHistoryWithStore();

  // Set up refs if they don't exist
  const imgRefInternal = useRef<HTMLImageElement | null>(null);
  const canvasRefInternal = useRef<HTMLCanvasElement | null>(null);

  /**
   * Get the current image reference
   */
  const getImageRef = useCallback(() => {
    return imageRef?.current || imgRefInternal.current;
  }, [imageRef]);

  /**
   * Get the current canvas reference
   */
  const getCanvasRef = useCallback(() => {
    return canvasRef?.current || canvasRefInternal.current;
  }, [canvasRef]);

  /**
   * Get the MIME type for a given format
   */
  const getMimeType = useCallback((format: string): string => {
    if (format === "webp") return "image/webp";
    if (format === "jpeg") return "image/jpeg";
    if (format === "png") return "image/png";
    return "image/jpeg"; // Default fallback
  }, []);

  /**
   * Crop an image and return a blob URL
   */
  const cropImage = useCallback(
    async (
      imgElement: HTMLImageElement,
      crop: PixelCrop,
      format: string
    ): Promise<string> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Calculate scale if the displayed image is resized
      const scaleX = imgElement.naturalWidth / imgElement.width;
      const scaleY = imgElement.naturalHeight / imgElement.height;

      // Set canvas dimensions to crop dimensions
      canvas.width = crop.width;
      canvas.height = crop.height;

      // Draw the cropped portion of the image
      ctx.drawImage(
        imgElement,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      // Convert to blob and create URL
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve(url);
          },
          getMimeType(format),
          0.9
        );
      });
    },
    [getMimeType]
  );

  /**
   * Resize an image and return a blob URL
   */
  const resizeImage = useCallback(
    async (
      imgElement: HTMLImageElement,
      newWidth: number,
      newHeight: number,
      format: string
    ): Promise<string> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Set canvas dimensions to desired resize values
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw the image with new dimensions
      ctx.drawImage(imgElement, 0, 0, newWidth, newHeight);

      // Convert to blob and create URL
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob conversion failed"));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve(url);
          },
          getMimeType(format),
          0.9
        );
      });
    },
    [getMimeType]
  );

  /**
   * Handle crop completion
   */
  const handleCropComplete = useCallback(
    async (crop: PixelCrop, imgElement: HTMLImageElement) => {
      if (!selectedImage) return;

      try {
        // Save current state for undo/redo
        saveState("crop");

        // Create cropped image URL
        const croppedUrl = await cropImage(imgElement, crop, format as string);

        // Update dimensions and preview
        actions.setWidth(crop.width);
        actions.setHeight(crop.height);
        actions.setPreviewUrl(croppedUrl);
        actions.setIsCropping(false);
        actions.setHasEdited(true);

        // Update stats
        await updateStatsAfterProcessing(croppedUrl);

        // If in standalone mode, update the image in the list
        const updatedImages = useImageStore
          .getState()
          .images.map((img) =>
            img.id === selectedImage.id ? { ...img, url: croppedUrl } : img
          );
        actions.setImages(updatedImages);

        // Revoke old URL if needed to prevent memory leaks
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
      cropImage,
    ]
  );

  /**
   * Handle resize dimensions change
   */
  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      actions.setWidth(newWidth);
      actions.setHeight(newHeight);
    },
    [actions]
  );

  /**
   * Apply resize operation
   */
  const applyResize = useCallback(async () => {
    const imgRef = getImageRef();
    if (!imgRef || !selectedImage) return;

    try {
      // Save state for undo/redo
      saveState("resize");

      // Create resized image URL
      const resizedUrl = await resizeImage(
        imgRef,
        width,
        height,
        format as string
      );

      // Update preview
      actions.setPreviewUrl(resizedUrl);
      actions.setHasEdited(true);

      // Update stats
      await updateStatsAfterProcessing(resizedUrl);

      // Update the image in the list if in standalone mode
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
    resizeImage,
  ]);

  /**
   * Handle blur effect
   */
  const handleBlurApply = useCallback(
    async (blurredImageUrl: string) => {
      if (!blurredImageUrl || !selectedImage) return;

      try {
        // Save state for undo/redo
        saveState("blur");

        // Update preview
        actions.setPreviewUrl(blurredImageUrl);
        actions.setIsBlurring(false);
        actions.setHasEdited(true);

        // Update stats
        await updateStatsAfterProcessing(blurredImageUrl);

        // Update the image in the list
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

  /**
   * Handle paint effect
   */
  const handlePaintApply = useCallback(
    async (paintedImageUrl: string) => {
      if (!paintedImageUrl || !selectedImage) return;

      try {
        // Save state for undo/redo
        saveState("paint");

        // Update preview
        actions.setPreviewUrl(paintedImageUrl);
        actions.setIsPainting(false);
        actions.setHasEdited(true);

        // Update stats
        await updateStatsAfterProcessing(paintedImageUrl);

        // Update the image in the list
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

  /**
   * Download edited image
   */
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

          // Clean up
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 100);
        }
      },
      getMimeType(format as string),
      0.9
    );
  }, [getCanvasRef, getImageRef, selectedImage, format, getMimeType]);

  /**
   * Initialize stats for a new image
   */
  const initializeImage = useCallback(
    (img: HTMLImageElement) => {
      if (!selectedImage?.file) return;

      // Store references
      imgRefInternal.current = img;
      actions.setImageRef({ current: imgRefInternal.current });

      // Set initial dimensions from the image
      actions.setWidth(img.naturalWidth);
      actions.setHeight(img.naturalHeight);

      // Initialize the canvas reference if needed
      if (!canvasRefInternal.current) {
        canvasRefInternal.current = document.createElement("canvas");
        actions.setCanvasRef({ current: canvasRefInternal.current });
      }

      // Reset editing state
      actions.setHasEdited(false);
      actions.setNewStats(null);

      // Get image dimensions and set original stats
      const imageSize = selectedImage.file.size || 0;

      // Safely get the image format
      const imageFormat = selectedImage.file.type
        ? selectedImage.file.type.split("/")[1] || "jpeg"
        : "jpeg";

      // Set original stats
      actions.setOriginalStats({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: imageSize,
        format: imageFormat,
      });
    },
    [selectedImage, actions]
  );

  /**
   * Safely determine file format from a file name
   */
  const getFileFormatFromName = useCallback((fileName: string): string => {
    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "jpeg";
      case "png":
        return "png";
      case "webp":
        return "webp";
      default:
        return "jpeg";
    }
  }, []);

  return {
    // Main operations
    handleCropComplete,
    handleResize,
    applyResize,
    handleBlurApply,
    handlePaintApply,
    downloadImage,
    initializeImage,

    // Helper functions
    cropImage,
    resizeImage,
    getMimeType,
    getFileFormatFromName,

    // Refs
    getImageRef,
    getCanvasRef,
  };
};
