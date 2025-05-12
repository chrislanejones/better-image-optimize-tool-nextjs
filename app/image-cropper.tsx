"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
// Import components
import Toolbar, { BlurControls, PaintControls } from "./components/toolbar";
import ImageStats from "./components/image-stats";
import CroppingTool, { type CroppingToolRef } from "./components/cropping-tool";
import PaintTool from "./components/paint-tool";
import ImageResizer from "./components/image-resizer";
import ImageZoomView from "./components/image-zoom-view";
import BlurBrushCanvas from "./components/blur-tool";

import {
  cropImage,
  resizeImage,
  safeRevokeURL,
} from "./utils/image-transformations";
import { getMimeType, getFileFormat } from "./utils/image-utils";
import { ImageFile, ImageCropperProps } from "@/types/types";
import imageDB from "@/app/utils/indexedDB";

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

// Update the ImageCropperProps in your types file to include onCompressionStateChange
interface ExtendedImageCropperProps extends ImageCropperProps {
  onCompressionStateChange?: (isCompressing: boolean) => void;
}

export default function ImageCropper({
  image,
  onUploadNew,
  onRemoveAll,
  onBackToGallery,
  isStandalone = false,
  onEditModeChange,
  onCompressionStateChange, // New handler for compression state
  // Pagination props
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onNavigateImage,
}: ExtendedImageCropperProps) {
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
  // Compression state
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  // Tool states
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [isEraser, setIsEraser] = useState<boolean>(false);

  // Stats states
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [newStats, setNewStats] = useState<ImageStats | null>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);

  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const blurCanvasRef = useRef<any>(null);
  const paintToolRef = useRef<any>(null);
  const cropToolRef = useRef<CroppingToolRef>(null);

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

  // Notify parent when compression state changes
  useEffect(() => {
    if (onCompressionStateChange) {
      onCompressionStateChange(isCompressing);
    }
  }, [isCompressing, onCompressionStateChange]);

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
      setIsCompressing(false);
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

  // Toggle functions
  const toggleEditMode = useCallback(() => {
    if (!isStandalone) {
      setIsEditMode((prev) => !prev);
    }

    setIsBlurring(false);
    setIsCropping(false);
    setIsPainting(false);
    setIsCompressing(false);
  }, [isStandalone]);

  const toggleCropping = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsCropping((prev) => !prev);
    setIsBlurring(false);
    setIsPainting(false);
    setIsCompressing(false);
  }, [isEditMode, isStandalone]);

  const toggleBlurring = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsBlurring((prev) => !prev);
    setIsCropping(false);
    setIsPainting(false);
    setIsCompressing(false);
  }, [isEditMode, isStandalone]);

  const togglePainting = useCallback(() => {
    if (!isEditMode && !isStandalone) {
      setIsEditMode(true);
    }
    setIsPainting((prev) => !prev);
    setIsCropping(false);
    setIsBlurring(false);
    setIsCompressing(false);
  }, [isEditMode, isStandalone]);

  // Exit edit mode completely
  const exitEditMode = useCallback(() => {
    setIsCropping(false);
    setIsBlurring(false);
    setIsPainting(false);
    setIsCompressing(false);
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

      // Enter compression mode when starting to resize
      setIsCompressing(true);
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

      // Set a timeout to exit compression mode after resize is applied
      setTimeout(() => {
        setIsCompressing(false);
      }, 800);
    } catch (error) {
      console.error("Error applying resize:", error);
      setIsCompressing(false);
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
  ]);

  // Handle image navigation
  const handleNavigateImage = useCallback(
    (direction: "next" | "prev" | "first" | "last") => {
      if (onNavigateImage) {
        onNavigateImage(direction);
      }
    },
    [onNavigateImage]
  );

  // Remaining handlers (cropping, blur, paint, etc.)
  const handleApplyCrop = useCallback(
    (croppedImageUrl: string) => {
      if (!croppedImageUrl) return;

      // Update the preview URL with the cropped image
      setPreviewUrl(croppedImageUrl);
      setIsCropping(false);
      setHasEdited(true);

      // Get image dimensions and update stats
      const img = new Image();
      img.src = croppedImageUrl;

      img.onload = async () => {
        // Fetch the blob to calculate size
        const blob = await fetch(croppedImageUrl).then((r) => r.blob());

        // Update stats
        setNewStats({
          width: img.width,
          height: img.height,
          size: blob.size,
          format: format || "unknown",
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update stored image if in standalone mode
        if (isStandalone) {
          await saveEditedImage(croppedImageUrl, blob);
        }
      };
    },
    [format, originalStats, isStandalone]
  );

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

  // Other handlers (blur, paint, zoom, etc.)
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
    [previewUrl, format, originalStats, isStandalone, image?.url]
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
    [previewUrl, format, originalStats, isStandalone, image?.url]
  );

  // Zoom in/out functions
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Save edited image to IndexedDB
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
    setIsCompressing(false);
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

      {/* Pass isCompressing to Toolbar */}
      <Toolbar
        isEditMode={isEditMode}
        isCropping={isCropping}
        isBlurring={isBlurring}
        isPainting={isPainting}
        isEraser={isEraser}
        isCompressing={isCompressing} // Pass the compression state
        format={format}
        onFormatChange={setFormat}
        onToggleEditMode={toggleEditMode}
        onToggleCropping={toggleCropping}
        onToggleBlurring={toggleBlurring}
        onTogglePainting={togglePainting}
        onToggleEraser={() => setIsEraser(!isEraser)}
        onApplyCrop={() => {
          if (cropToolRef.current) {
            cropToolRef.current.applyCrop();
          }
        }}
        onApplyBlur={handleBlurApply}
        onApplyPaint={handlePaintApply}
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
        // Always pass pagination props
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onNavigateImage={handleNavigateImage}
      />

      {/* Display appropriate tool controls based on active tool */}
      {isBlurring && (
        <BlurBrushCanvas
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
                    ref={cropToolRef}
                    imageUrl={previewUrl}
                    onApply={handleApplyCrop}
                    onCancel={cancelCrop}
                  />
                ) : isBlurring ? (
                  <BlurControls
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    onBlurAmountChange={setBlurAmount}
                    onBlurRadiusChange={setBlurRadius}
                  />
                ) : isPainting ? (
                  <PaintTool
                    imageUrl={previewUrl}
                    onApplyPaint={handlePaintApply}
                    onCancel={cancelPaint}
                    onToggleEraser={() => setIsEraser(!isEraser)}
                    isEraser={isEraser}
                  />
                ) : (
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
                // Always pass pagination props
                currentPage={currentPage}
                totalPages={totalPages}
                onNavigateImage={handleNavigateImage}
                // Pass isCompressing flag
                isCompressing={isCompressing}
              />

              {hasEdited && <ImageZoomView imageUrl={previewUrl} />}
            </aside>
          )}
        </div>

        {/* Image Information Cards */}
        {!isEditMode && !isBlurring && !isPainting && (
          <ImageStats
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
