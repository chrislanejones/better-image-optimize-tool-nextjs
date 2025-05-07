"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ImageControls from "./components/image-controls";
import CroppingTool from "./components/cropping-tool";
import ImageResizer from "./components/image-resizer";
import ImageZoomView from "./components/image-zoom-view";
import { PaintControls } from "./components/editor-controls";
import BlurBrushCanvas from "./components/blur-canvas";
import PaintTool from "./components/paint-tool";
import ImageStatsComponent from "./components/image-stats";
import { imageDB } from "./utils/indexedDB";

import {
  cropImage,
  resizeImage,
  safeRevokeURL,
} from "./utils/image-transformations";
import { getMimeType, getFileFormat } from "./utils/image-utils";

// Import the types from editor.ts
import {
  type ImageFile,
  type ImageCropperProps,
  type ImageStats, // This is the type definition
  type BlurBrushCanvasRef,
  type PaintToolRef,
} from "@/types/editor";

// Remove the interface definitions from here since they're now in editor.ts

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export default function ImageCropper({
  image,
  onUploadNew,
  onRemoveAll,
  onBackToGallery,
  isStandalone = false,
  onEditModeChange,
  // Add these new props with default values
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}: ImageCropperProps) {
  // Basic state
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [format, setFormat] = useState<string>("jpeg");
  const [previewUrl, setPreviewUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  // Editing mode states
  const [isEditMode, setIsEditMode] = useState<boolean>(isStandalone);
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [isBlurring, setIsBlurring] = useState<boolean>(false);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  // Tool states
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [isEraser, setIsEraser] = useState<boolean>(false);

  // Stats states
  // Use the imported type
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [newStats, setNewStats] = useState<ImageStats | null>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);

  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const blurCanvasRef = useRef<BlurBrushCanvasRef>(null);
  const paintToolRef = useRef<PaintToolRef>(null);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Notify parent component when edit mode changes
  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(isEditMode);
    }
  }, [isEditMode, onEditModeChange]);

  // Initialize image when component mounts or image changes
  useEffect(() => {
    if (!isMounted) return;

    // Initialize with a safe URL
    const safeUrl =
      image?.url && typeof image.url === "string"
        ? image.url
        : PLACEHOLDER_IMAGE;

    setPreviewUrl(safeUrl);

    // For standalone mode, always start in edit mode
    if (!isStandalone) {
      setIsCropping(false);
      setIsBlurring(false);
      setIsPainting(false);
    }

    setZoom(1);
    setHasEdited(false);
    setNewStats(null);

    // Get image dimensions
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);

      // Set original stats with safe values
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: image?.file ? image.file.size : 0,
        format: image?.file?.type ? getFileFormat(image.file.type) : "unknown",
      });
    };

    // Set a safe image source
    img.src = safeUrl;

    // Clean up object URL on unmount if we created one
    return () => {
      if (
        previewUrl &&
        previewUrl !== PLACEHOLDER_IMAGE &&
        image?.url &&
        previewUrl !== image.url
      ) {
        safeRevokeURL(previewUrl);
      }
    };
  }, [image, isStandalone, isMounted]);

  // Update isEditMode when editing tools are activated
  useEffect(() => {
    if ((isCropping || isBlurring || isPainting) && !isEditMode) {
      setIsEditMode(true);
    }
  }, [isCropping, isBlurring, isPainting, isEditMode]);

  // Save edited image to IndexedDB - MOVED UP BEFORE IT'S USED
  const saveEditedImage = useCallback(
    async (url: string, blob: Blob) => {
      if (!image?.id || !image?.file?.name) return;

      try {
        setIsSaving(true);
        // Create a file from the blob
        const fileName = image.file.name;
        const fileType = getMimeType(format);

        // Convert the blob to base64
        const base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
        });

        // Update in IndexedDB
        await imageDB.updateImage(image.id, {
          fileData: base64Data,
          type: fileType,
          width: width || 0,
          height: height || 0,
          lastModified: new Date().getTime(),
        });

        setIsSaving(false);
      } catch (error) {
        console.error("Error saving edited image:", error);
        setIsSaving(false);
      }
    },
    [image, format, width, height]
  );

  // Toggle functions
  const toggleEditMode = useCallback(() => {
    if (!isStandalone) {
      setIsEditMode((prev) => !prev);
    }

    setIsBlurring(false);
    setIsCropping(false);
    setIsPainting(false);
  }, [isStandalone]);

  const toggleCropping = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsCropping((prev) => !prev);
    setIsBlurring(false);
    setIsPainting(false);
  }, [isEditMode, isStandalone]);

  const toggleBlurring = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsBlurring((prev) => !prev);
    setIsCropping(false);
    setIsPainting(false);
  }, [isEditMode, isStandalone]);

  const togglePainting = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsPainting((prev) => !prev);
    setIsCropping(false);
    setIsBlurring(false);
  }, [isEditMode, isStandalone]);

  // Cancel functions
  const cancelBlur = useCallback(() => {
    setIsBlurring(false);
  }, []);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  const cancelPaint = useCallback(() => {
    setIsPainting(false);
  }, []);

  // Exit edit mode completely
  const exitEditMode = useCallback(() => {
    setIsCropping(false);
    setIsBlurring(false);
    setIsPainting(false);
    if (!isStandalone) {
      setIsEditMode(false);
    }
  }, [isStandalone]);

  // Handle back to gallery
  const handleBackToGallery = useCallback(() => {
    if (onBackToGallery) {
      onBackToGallery();
    } else {
      // If no handler provided, just go back to upload state
      onUploadNew();
    }
  }, [onBackToGallery, onUploadNew]);

  // Image editing handlers
  const handleResize = useCallback(
    async (newWidth: number, newHeight: number) => {
      if (!imgRef.current) return;

      // We just set the dimensions, but don't apply them yet
      setWidth(newWidth);
      setHeight(newHeight);
    },
    []
  );

  const applyResize = useCallback(async () => {
    if (!imgRef.current) return;

    try {
      // Get the current image URL
      const oldPreviewUrl = previewUrl;

      // Resize the image
      const resizedUrl = await resizeImage(
        imgRef.current,
        width,
        height,
        format
      );

      // Update the preview
      setPreviewUrl(resizedUrl);
      setHasEdited(true);

      // Fetch the blob to calculate size
      const blob = await fetch(resizedUrl).then((r) => r.blob());

      // Update stats
      setNewStats({
        width,
        height,
        size: blob.size,
        format: format || "unknown",
      });

      // Calculate data savings
      if (originalStats) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the stored image if in standalone mode
      if (isStandalone) {
        await saveEditedImage(resizedUrl, blob);
      }

      // Clean up old URL if needed
      if (oldPreviewUrl !== PLACEHOLDER_IMAGE && oldPreviewUrl !== image?.url) {
        safeRevokeURL(oldPreviewUrl);
      }
    } catch (error) {
      console.error("Error applying resize:", error);
    }
  }, [
    imgRef,
    width,
    height,
    format,
    previewUrl,
    originalStats,
    isStandalone,
    image?.url,
    saveEditedImage,
  ]);

  const handleCropComplete = useCallback(
    async (crop: PixelCrop, imgElement: HTMLImageElement) => {
      try {
        // Get the current image URL
        const oldPreviewUrl = previewUrl;

        // Apply the crop
        const croppedUrl = await cropImage(imgElement, crop, format);

        // Update dimensions after crop
        setWidth(crop.width);
        setHeight(crop.height);

        // Update the preview
        setPreviewUrl(croppedUrl);
        setIsCropping(false);
        setHasEdited(true);

        // Fetch the blob to calculate size
        const blob = await fetch(croppedUrl).then((r) => r.blob());

        // Update stats
        setNewStats({
          width: crop.width,
          height: crop.height,
          size: blob.size,
          format: format || "unknown",
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update the stored image if in standalone mode
        if (isStandalone) {
          await saveEditedImage(croppedUrl, blob);
        }

        // Clean up old URL if needed
        if (
          oldPreviewUrl !== PLACEHOLDER_IMAGE &&
          oldPreviewUrl !== image?.url
        ) {
          safeRevokeURL(oldPreviewUrl);
        }
      } catch (error) {
        console.error("Error applying crop:", error);
      }
    },
    [
      previewUrl,
      format,
      originalStats,
      isStandalone,
      image?.url,
      saveEditedImage,
    ]
  );

  // Define handleBlurApply and handlePaintApply after saveEditedImage
  const handleBlurApply = useCallback(
    async (blurredImageUrl: string) => {
      if (!blurredImageUrl || typeof blurredImageUrl !== "string") return;

      try {
        // Get the current image URL
        const oldPreviewUrl = previewUrl;

        setPreviewUrl(blurredImageUrl);
        setIsBlurring(false);
        setHasEdited(true);

        // Fetch the blob to calculate size
        const blob = await fetch(blurredImageUrl).then((r) => r.blob());

        // Get image dimensions
        const img = new Image();
        img.src = blurredImageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Update stats
            setNewStats({
              width: img.naturalWidth,
              height: img.naturalHeight,
              size: blob.size,
              format: format || "unknown",
            });
            resolve();
          };
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update the stored image if in standalone mode
        if (isStandalone) {
          await saveEditedImage(blurredImageUrl, blob);
        }

        // Clean up old URL if needed
        if (
          oldPreviewUrl !== PLACEHOLDER_IMAGE &&
          oldPreviewUrl !== image?.url
        ) {
          safeRevokeURL(oldPreviewUrl);
        }
      } catch (error) {
        console.error("Error applying blur:", error);
      }
    },
    [
      previewUrl,
      format,
      originalStats,
      isStandalone,
      image?.url,
      saveEditedImage,
    ]
  );

  const handlePaintApply = useCallback(
    async (paintedImageUrl: string) => {
      if (!paintedImageUrl || typeof paintedImageUrl !== "string") return;

      try {
        // Get the current image URL
        const oldPreviewUrl = previewUrl;

        setPreviewUrl(paintedImageUrl);
        setIsPainting(false);
        setHasEdited(true);

        // Fetch the blob to calculate size
        const blob = await fetch(paintedImageUrl).then((r) => r.blob());

        // Get image dimensions
        const img = new Image();
        img.src = paintedImageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Update stats
            setNewStats({
              width: img.naturalWidth,
              height: img.naturalHeight,
              size: blob.size,
              format: format || "unknown",
            });
            resolve();
          };
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update the stored image if in standalone mode
        if (isStandalone) {
          await saveEditedImage(paintedImageUrl, blob);
        }

        // Clean up old URL if needed
        if (
          oldPreviewUrl !== PLACEHOLDER_IMAGE &&
          oldPreviewUrl !== image?.url
        ) {
          safeRevokeURL(oldPreviewUrl);
        }
      } catch (error) {
        console.error("Error applying paint:", error);
      }
    },
    [
      previewUrl,
      format,
      originalStats,
      isStandalone,
      image?.url,
      saveEditedImage,
    ]
  );

  // Then define these functions that use the above functions
  const handleApplyBlur = useCallback(() => {
    if (blurCanvasRef.current) {
      const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
      if (dataUrl) {
        handleBlurApply(dataUrl);
      }
    }
  }, [handleBlurApply]);

  const handleApplyPaint = useCallback(() => {
    if (paintToolRef.current) {
      const dataUrl = paintToolRef.current.getCanvasDataUrl();
      if (dataUrl) {
        handlePaintApply(dataUrl);
      }
    }
  }, [handlePaintApply]);

  // Zoom in/out functions
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Download current image
  const downloadImage = useCallback(() => {
    if (!canvasRef.current || !image?.file?.name) return;

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
  }, [imgRef, canvasRef, image, format]);

  // Reset image to original
  const resetImage = useCallback(() => {
    // Revoke previous URL to prevent memory leaks
    if (
      previewUrl &&
      previewUrl !== PLACEHOLDER_IMAGE &&
      image?.url &&
      previewUrl !== image.url
    ) {
      safeRevokeURL(previewUrl);
    }

    // Set a safe image source
    const safeUrl =
      image?.url && typeof image.url === "string"
        ? image.url
        : PLACEHOLDER_IMAGE;

    setPreviewUrl(safeUrl);

    setIsCropping(false);
    setIsBlurring(false);
    setIsPainting(false);
    setHasEdited(false);
    setNewStats(null);

    // Reset dimensions to original
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
    };

    // Set a safe image source
    img.src = safeUrl;
  }, [previewUrl, image]);

  // Don't render until client-side to prevent hydration errors
  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
        <div className="h-64 w-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-center">Saving changes...</p>
          </div>
        </div>
      )}

      <ImageControls
        isEditMode={isEditMode}
        isCropping={isCropping}
        isBlurring={isBlurring}
        isPainting={isPainting}
        isEraser={isEraser}
        format={format}
        onFormatChange={setFormat}
        onToggleEditMode={toggleEditMode}
        onToggleCropping={toggleCropping}
        onToggleBlurring={toggleBlurring}
        onTogglePainting={togglePainting}
        onToggleEraser={() => setIsEraser(!isEraser)}
        onApplyCrop={() => {}}
        onApplyBlur={handleApplyBlur}
        onApplyPaint={handleApplyPaint}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetImage}
        onDownload={downloadImage}
        onUploadNew={onUploadNew}
        onRemoveAll={onRemoveAll}
        onCancelBlur={cancelBlur}
        onCancelCrop={cancelCrop}
        onCancelPaint={cancelPaint}
        onBackToGallery={handleBackToGallery}
        onExitEditMode={exitEditMode}
        isStandalone={isStandalone}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      {/* Display appropriate tool controls based on active tool */}
      {isBlurring && (
        <BlurBrushCanvas
          ref={blurCanvasRef}
          imageUrl={previewUrl}
          blurAmount={blurAmount}
          blurRadius={blurRadius}
          onApply={handleBlurApply}
          onCancel={cancelBlur}
          onBlurAmountChange={setBlurAmount}
          onBlurRadiusChange={setBlurRadius}
        />
      )}

      {isPainting && (
        <PaintControls
          brushSize={brushSize}
          brushColor={brushColor}
          onBrushSizeChange={setBrushSize}
          onBrushColorChange={setBrushColor}
        />
      )}

      <div className="flex flex-col gap-6">
        <div
          className={`grid grid-cols-1 ${
            isEditMode ? "md:grid-cols-1" : "md:grid-cols-4"
          } gap-6`}
        >
          <section className={isEditMode ? "col-span-1" : "md:col-span-3"}>
            <div className="space-y-2">
              <div
                className="relative border rounded-lg overflow-hidden"
                ref={imageContainerRef}
              >
                {isCropping ? (
                  <CroppingTool
                    imageUrl={previewUrl}
                    onApplyCrop={handleCropComplete}
                    onCancel={cancelCrop}
                    zoom={zoom} // Pass zoom prop
                  />
                ) : isBlurring ? (
                  <BlurBrushCanvas
                    ref={blurCanvasRef}
                    imageUrl={previewUrl}
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    onApply={handleBlurApply}
                    onCancel={cancelBlur}
                    onBlurAmountChange={setBlurAmount}
                    onBlurRadiusChange={setBlurRadius}
                    zoom={zoom} // Pass zoom prop
                  />
                ) : isPainting ? (
                  <PaintTool
                    ref={paintToolRef}
                    imageUrl={previewUrl}
                    onApplyPaint={handlePaintApply}
                    onCancel={cancelPaint}
                    onToggleEraser={() => setIsEraser(!isEraser)}
                    isEraser={isEraser}
                    zoom={zoom} // Pass zoom prop
                  />
                ) : (
                  // Regular image view
                  <div
                    className="overflow-auto"
                    style={{
                      maxHeight: isEditMode ? "85vh" : "700px",
                      height: isEditMode ? "85vh" : "70vh",
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl || PLACEHOLDER_IMAGE}
                      alt="Edited image"
                      className="max-w-full transform origin-top-left"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {!isEditMode && !isBlurring && !isPainting && (
            <aside className="md:col-span-1 space-y-6">
              <ImageResizer
                width={width}
                height={height}
                maxWidth={imgRef.current?.naturalWidth || 1000}
                maxHeight={imgRef.current?.naturalHeight || 1000}
                onResize={handleResize}
                onApplyResize={applyResize}
                format={format}
                onFormatChange={setFormat}
                onDownload={downloadImage}
              />

              {hasEdited && <ImageZoomView imageUrl={previewUrl} />}
            </aside>
          )}
        </div>

        {/* Image Information Cards */}
        {!isEditMode && !isBlurring && !isPainting && (
          <ImageStatsComponent
            originalStats={originalStats}
            newStats={newStats}
            dataSavings={dataSavings}
            hasEdited={hasEdited}
            fileName={image?.file?.name || "image.png"}
            format={format}
            fileType={image?.file?.type || "image/png"}
          />
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
