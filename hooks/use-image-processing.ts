// hooks/use-image-processing.ts
import { useState, useRef, useEffect } from "react";
import { ImageFile, ImageStats } from "@/types/editor";
import { getMimeType, getFileFormat } from "@/app/utils/image-utils";
import { imageDB } from "@/app/utils/indexedDB";

/**
 * Custom hook for image processing operations
 */
export function useImageProcessing(
  image: ImageFile | null,
  isStandalone = false
) {
  // State for image dimensions and format
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [format, setFormat] = useState<string>("jpeg");

  // State for image preview and stats
  const [previewUrl, setPreviewUrl] = useState<string>("/placeholder.svg");
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [newStats, setNewStats] = useState<ImageStats | null>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Zoom state
  const [zoom, setZoom] = useState<number>(1);

  // Refs for image and canvas
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize image when component mounts or image changes
  useEffect(() => {
    if (!image) return;

    // Initialize with the image URL
    const safeUrl = image.url || "/placeholder.svg";
    setPreviewUrl(safeUrl);
    setZoom(1);
    setHasEdited(false);
    setNewStats(null);

    // Get image dimensions
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);

      // Set original stats
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: image.file ? image.file.size : 0,
        format:
          image.file && image.file.type
            ? getFileFormat(image.file.type)
            : "unknown",
      });
    };

    // Set a safe image source
    img.src = safeUrl;

    // Clean up object URL on unmount if we created one
    return () => {
      if (
        previewUrl &&
        previewUrl !== "/placeholder.svg" &&
        image.url &&
        previewUrl !== image.url
      ) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch (e) {
          console.warn("Error revoking URL:", e);
        }
      }
    };
  }, [image]);

  /**
   * Resize the image to new dimensions
   */
  const handleResize = (newWidth: number, newHeight: number) => {
    if (!imgRef.current) return;
    setWidth(newWidth);
    setHeight(newHeight);
  };

  /**
   * Apply resize changes to the image
   */
  const applyResize = async () => {
    if (!imgRef.current || !image) return;

    try {
      // Get the current image URL
      const oldPreviewUrl = previewUrl;

      // Create a canvas to resize the image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw the image at the new size
      ctx.drawImage(imgRef.current, 0, 0, width, height);

      // Convert to the selected format
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
          },
          getMimeType(format),
          0.9
        );
      });

      // Create object URL
      const resizedUrl = URL.createObjectURL(blob);
      setPreviewUrl(resizedUrl);
      setHasEdited(true);

      // Update stats
      setNewStats({
        width,
        height,
        size: blob.size,
        format,
      });

      // Calculate data savings
      if (originalStats && originalStats.size > 0) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the stored image if in standalone mode
      if (isStandalone && image.id) {
        await saveEditedImage(resizedUrl, blob, image.id);
      }

      // Clean up old URL
      if (oldPreviewUrl !== "/placeholder.svg" && oldPreviewUrl !== image.url) {
        try {
          URL.revokeObjectURL(oldPreviewUrl);
        } catch (e) {
          console.warn("Error revoking URL:", e);
        }
      }
    } catch (error) {
      console.error("Error applying resize:", error);
    }
  };

  /**
   * Apply crop to the image
   */
  const applyCrop = async (crop: any, imgElement: HTMLImageElement) => {
    if (!image) return;

    try {
      // Get the current image URL
      const oldPreviewUrl = previewUrl;

      // Create a canvas to crop the image
      const canvas = document.createElement("canvas");
      const scaleX = imgElement.naturalWidth / imgElement.width;
      const scaleY = imgElement.naturalHeight / imgElement.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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

      // Convert to the selected format
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
          },
          getMimeType(format),
          0.9
        );
      });

      // Update dimensions
      setWidth(crop.width);
      setHeight(crop.height);

      // Create object URL
      const croppedUrl = URL.createObjectURL(blob);
      setPreviewUrl(croppedUrl);
      setHasEdited(true);

      // Update stats
      setNewStats({
        width: crop.width,
        height: crop.height,
        size: blob.size,
        format,
      });

      // Calculate data savings
      if (originalStats && originalStats.size > 0) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the stored image if in standalone mode
      if (isStandalone && image.id) {
        await saveEditedImage(croppedUrl, blob, image.id);
      }

      // Clean up old URL
      if (oldPreviewUrl !== "/placeholder.svg" && oldPreviewUrl !== image.url) {
        try {
          URL.revokeObjectURL(oldPreviewUrl);
        } catch (e) {
          console.warn("Error revoking URL:", e);
        }
      }
    } catch (error) {
      console.error("Error applying crop:", error);
    }
  };

  /**
   * Apply edits like blur, paint, or text to the image
   */
  const applyEdit = async (editedImageUrl: string) => {
    if (!image) return;

    try {
      // Get the current image URL
      const oldPreviewUrl = previewUrl;

      // Set the new URL
      setPreviewUrl(editedImageUrl);
      setHasEdited(true);

      // Fetch the blob to calculate size
      const blob = await fetch(editedImageUrl).then((r) => r.blob());

      // Get image dimensions
      const img = new Image();
      img.src = editedImageUrl;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          // Update dimensions
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);

          // Update stats
          setNewStats({
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: blob.size,
            format,
          });
          resolve();
        };
      });

      // Calculate data savings
      if (originalStats && originalStats.size > 0) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the stored image if in standalone mode
      if (isStandalone && image.id) {
        await saveEditedImage(editedImageUrl, blob, image.id);
      }

      // Clean up old URL
      if (oldPreviewUrl !== "/placeholder.svg" && oldPreviewUrl !== image.url) {
        try {
          URL.revokeObjectURL(oldPreviewUrl);
        } catch (e) {
          console.warn("Error revoking URL:", e);
        }
      }
    } catch (error) {
      console.error("Error applying edit:", error);
    }
  };

  /**
   * Reset image to original
   */
  const resetImage = () => {
    if (!image) return;

    // Revoke previous URL to prevent memory leaks
    if (
      previewUrl &&
      previewUrl !== "/placeholder.svg" &&
      previewUrl !== image.url
    ) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {
        console.warn("Error revoking URL:", e);
      }
    }

    // Reset to original image
    setPreviewUrl(image.url || "/placeholder.svg");
    setHasEdited(false);
    setNewStats(null);

    // Reset dimensions to original
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = image.url || "/placeholder.svg";
  };

  /**
   * Download the current image
   */
  const downloadImage = () => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || !imgRef.current) return;

    // Set canvas dimensions to match current image
    canvas.width = imgRef.current.naturalWidth;
    canvas.height = imgRef.current.naturalHeight;

    // Draw the current image to canvas
    ctx.drawImage(imgRef.current, 0, 0);

    // Convert to the selected format and download
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const fileName = image.file.name.split(".")[0] || "image";
          a.download = `${fileName}-edited.${
            format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png"
          }`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      getMimeType(format),
      0.9
    );
  };

  // Helper function to save edited image to IndexedDB
  const saveEditedImage = async (url: string, blob: Blob, imageId: string) => {
    try {
      setIsSaving(true);

      // Convert the blob to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      });

      // Update in IndexedDB
      await imageDB.updateImage(imageId, {
        fileData: base64Data,
        type: getMimeType(format),
        width: width || 0,
        height: height || 0,
        lastModified: new Date().getTime(),
      });
    } catch (error) {
      console.error("Error saving edited image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Zoom controls
  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  return {
    // States
    width,
    height,
    format,
    previewUrl,
    originalStats,
    newStats,
    dataSavings,
    hasEdited,
    isSaving,
    zoom,

    // Refs
    imgRef,
    canvasRef,

    // Setters
    setFormat,

    // Actions
    handleResize,
    applyResize,
    applyCrop,
    applyEdit,
    resetImage,
    downloadImage,
    zoomIn,
    zoomOut,
  };
}
