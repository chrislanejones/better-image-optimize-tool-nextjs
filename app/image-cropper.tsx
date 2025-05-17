// Updated Image Cropper with improved compression and database updates
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Minus,
  Plus,
  Crop,
  Droplets,
  Paintbrush,
  Check,
  RefreshCw,
  Trash2,
  Eraser,
  Type,
  Images,
  Moon,
  Sun,
  User,
  Undo,
  Redo,
  RotateCw,
  RotateCcw,
  ArrowLeft,
  Pencil,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import CroppingTool, { type CroppingToolRef } from "./components/cropping-tool";
import BlurBrushCanvas from "./components/blur-tool";
import PaintTool from "./components/paint-tool";
import ImageResizer from "./components/image-resizer";
import ImageStats from "./components/image-stats";
import ImageZoomView from "./components/image-zoom-view";
import SimplePagination from "./components/pagination-controls";
import {
  ImageCropperProps,
  NavigationDirection,
  ImageInfo,
  EditorMode,
} from "@/types/types";
import {
  compressImage,
  resizeImage,
  safeRevokeURL,
  getBlobFromUrl,
} from "./utils/image-transformations";
import { getMimeType, getFileFormat } from "./utils/image-utils";
import imageDB from "@/app/utils/indexedDB";
import { useToast } from "@/hooks/use-toast";

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
  onCompressionStateChange,
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
  const [quality, setQuality] = useState<number>(85); // Default quality setting
  const [compressionProgress, setCompressionProgress] = useState<number>(0);

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
  const [originalStats, setOriginalStats] = useState<any | null>(null);
  const [newStats, setNewStats] = useState<any | null>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);

  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const blurCanvasRef = useRef<any>(null);
  const paintToolRef = useRef<any>(null);
  const cropToolRef = useRef<CroppingToolRef>(null);

  // Toast notifications
  const { toast } = useToast();

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

      // Set dimensions
      setWidth(newWidth);
      setHeight(newHeight);

      // IMPORTANT: Don't automatically set isCompressing to true
      // This allows the user to adjust dimensions without disabling the Apply button
      // setIsCompressing(true); <- REMOVE THIS LINE

      // Mark as edited if dimensions have changed
      if (
        originalStats &&
        (newWidth !== originalStats.width || newHeight !== originalStats.height)
      ) {
        setHasEdited(true);
      }
    },
    [originalStats]
  );
  // Improved apply resize with proper compression
  const applyResize = useCallback(async () => {
    if (!imgRef.current || !originalStats) return;

    try {
      // Start compression
      setIsCompressing(true);

      // Simulate progress steps
      let progress = 0;
      const updateProgress = () => {
        progress += 5;
        if (progress > 95) return;
        setCompressionProgress(progress);
        setTimeout(updateProgress, 100);
      };
      updateProgress();

      // Get the current image
      const oldPreviewUrl = previewUrl;

      // Resize and compress the image with quality setting
      const resizedUrl = await resizeImage(
        imgRef.current,
        width,
        height,
        format,
        quality / 100 // Convert 0-100 to 0-1 range
      );

      // Set final progress
      setCompressionProgress(100);

      // Update the preview
      setPreviewUrl(resizedUrl);
      setHasEdited(true);

      // Get a blob from the resized URL to calculate size
      const blob = await getBlobFromUrl(resizedUrl);

      // Update stats
      const newStats = {
        width,
        height,
        size: blob.size,
        format,
      };

      setNewStats(newStats);

      // Calculate data savings
      if (originalStats) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the stored image if in standalone mode
      if (isStandalone && image?.id) {
        await saveEditedImage(resizedUrl, blob);

        // Show success toast
        toast({
          title: "Image Updated",
          description: `Successfully resized to ${width}×${height} and reduced file size by ${Math.round(
            dataSavings
          )}%`,
        });
      }

      // Clean up old URL if needed
      if (oldPreviewUrl !== PLACEHOLDER_IMAGE && oldPreviewUrl !== image?.url) {
        safeRevokeURL(oldPreviewUrl);
      }

      // Set a timeout to exit compression mode after resize is applied
      setTimeout(() => {
        setIsCompressing(false);
        setCompressionProgress(0);
      }, 800);
    } catch (error) {
      console.error("Error applying resize:", error);
      setIsCompressing(false);
      setCompressionProgress(0);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to resize image. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    imgRef,
    width,
    height,
    format,
    quality,
    previewUrl,
    originalStats,
    isStandalone,
    image?.id,
    image?.url,
    dataSavings,
    toast,
  ]);

  // Handle image navigation
  const handleNavigateImage = useCallback(
    (direction: NavigationDirection) => {
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
        try {
          // Fetch the blob to calculate size
          const blob = await getBlobFromUrl(croppedImageUrl);

          // Update stats
          const newStats = {
            width: img.width,
            height: img.height,
            size: blob.size,
            format,
          };

          setWidth(img.width);
          setHeight(img.height);
          setNewStats(newStats);

          // Calculate data savings
          if (originalStats) {
            const savings = 100 - (blob.size / originalStats.size) * 100;
            setDataSavings(savings);
          }

          // Update stored image if in standalone mode
          if (isStandalone && image?.id) {
            await saveEditedImage(croppedImageUrl, blob);

            // Show success notification
            toast({
              title: "Image Cropped",
              description: `New dimensions: ${img.width}×${img.height}`,
            });
          }
        } catch (error) {
          console.error("Error processing cropped image:", error);
          toast({
            title: "Error",
            description: "Failed to process cropped image",
            variant: "destructive",
          });
        }
      };
    },
    [format, originalStats, isStandalone, image?.id, toast]
  );

  // Cancel functions
  const cancelBlur = useCallback(() => {
    setIsBlurring(false);
    setIsEditMode(true);
  }, []);

  const cancelCrop = useCallback(() => {
    setIsCropping(false);
    setIsEditMode(true);
  }, []);

  const cancelPaint = useCallback(() => {
    setIsPainting(false);
    setIsEditMode(true);
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
        const blob = await getBlobFromUrl(blurredImageUrl);

        // Get image dimensions
        const img = new Image();
        img.src = blurredImageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Update stats
            setNewStats({
              width: img.width,
              height: img.height,
              size: blob.size,
              format,
            });

            setWidth(img.width);
            setHeight(img.height);
            resolve();
          };
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update the stored image if in standalone mode
        if (isStandalone && image?.id) {
          await saveEditedImage(blurredImageUrl, blob);

          // Show success notification
          toast({
            title: "Blur Applied",
            description: "Image was updated successfully",
          });
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
        toast({
          title: "Error",
          description: "Failed to apply blur effect",
          variant: "destructive",
        });
      }
    },
    [
      previewUrl,
      format,
      originalStats,
      isStandalone,
      image?.id,
      image?.url,
      toast,
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
        const blob = await getBlobFromUrl(paintedImageUrl);

        // Get image dimensions
        const img = new Image();
        img.src = paintedImageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Update stats
            setNewStats({
              width: img.width,
              height: img.height,
              size: blob.size,
              format,
            });

            setWidth(img.width);
            setHeight(img.height);
            resolve();
          };
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (blob.size / originalStats.size) * 100;
          setDataSavings(savings);
        }

        // Update the stored image if in standalone mode
        if (isStandalone && image?.id) {
          await saveEditedImage(paintedImageUrl, blob);

          // Show success notification
          toast({
            title: "Paint Applied",
            description: "Image was updated successfully",
          });
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
        toast({
          title: "Error",
          description: "Failed to apply paint effect",
          variant: "destructive",
        });
      }
    },
    [
      previewUrl,
      format,
      originalStats,
      isStandalone,
      image?.id,
      image?.url,
      toast,
    ]
  );

  // Zoom in/out functions
  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Save edited image to IndexedDB with improved method
  const saveEditedImage = useCallback(
    async (url: string, blob: Blob) => {
      if (!image?.id || !image?.file?.name) return;

      try {
        setIsSaving(true);

        // Create file metadata
        const fileName = image.file.name;
        const fileType = getMimeType(format);

        // Convert the blob to base64 for storage
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

        // Update success notification
        toast({
          title: "Saved to Database",
          description: `File saved as ${format.toUpperCase()}, ${Math.round(
            blob.size / 1024
          )} KB`,
        });
      } catch (error) {
        console.error("Error saving edited image:", error);
        setIsSaving(false);

        // Show error toast
        toast({
          title: "Database Error",
          description: "Failed to save image to database",
          variant: "destructive",
        });
      }
    },
    [image, format, width, height, toast]
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

          // Show download success notification
          toast({
            title: "Download Complete",
            description: `File saved as ${format.toUpperCase()}, ${Math.round(
              blob.size / 1024
            )} KB`,
          });
        }
      },
      getMimeType(format),
      quality / 100 // Convert 0-100 to 0-1 range
    );
  }, [imgRef, canvasRef, image, format, quality, toast]);

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
    if (originalStats) {
      setWidth(originalStats.width);
      setHeight(originalStats.height);
    }

    // Reset quality to default
    setQuality(85);

    // Show reset notification
    toast({
      title: "Image Reset",
      description: "Image has been restored to original state",
    });
  }, [previewUrl, image, originalStats, toast]);

  // Handle quality change
  const handleQualityChange = (value: number) => {
    setQuality(value);
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <Button onClick={zoomOut} variant="outline" className="h-9 w-9 p-0">
            <Minus className="h-4 w-4" />
          </Button>
          <Button onClick={zoomIn} variant="outline" className="h-9 w-9 p-0">
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            onClick={toggleEditMode}
            variant={isEditMode ? "default" : "outline"}
            className="h-9"
          >
            {isEditMode ? (
              <>
                <X className="mr-1 h-4 w-4" />
                Exit Edit
              </>
            ) : (
              <>
                <Pencil className="mr-1 h-4 w-4" />
                Edit
              </>
            )}
          </Button>

          {/* Only show tool buttons in edit mode */}
          {isEditMode && (
            <div className="flex gap-1">
              <Button
                onClick={toggleCropping}
                variant={isCropping ? "default" : "outline"}
                className="h-9"
              >
                <Crop className="mr-1 h-4 w-4" />
                Crop
              </Button>

              <Button
                onClick={toggleBlurring}
                variant={isBlurring ? "default" : "outline"}
                className="h-9"
              >
                <Droplets className="mr-1 h-4 w-4" />
                Blur
              </Button>

              <Button
                onClick={togglePainting}
                variant={isPainting ? "default" : "outline"}
                className="h-9"
              >
                <Paintbrush className="mr-1 h-4 w-4" />
                Paint
              </Button>
            </div>
          )}
        </div>

        {/* Compression indicator */}
        {isCompressing && (
          <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded-full animate-pulse ml-2">
            <div className="animate-spin h-3 w-3 rounded-full border-2 border-blue-300 border-t-transparent"></div>
            <span className="text-xs font-medium text-blue-100">
              {compressionProgress}%
            </span>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <Button onClick={resetImage} variant="outline" className="h-9">
            <RefreshCw className="mr-1 h-4 w-4" />
            Reset
          </Button>

          <Button onClick={downloadImage} variant="outline" className="h-9">
            <Download className="mr-1 h-4 w-4" />
            Download
          </Button>

          {onBackToGallery && (
            <Button
              onClick={handleBackToGallery}
              variant="outline"
              className="h-9"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Gallery
            </Button>
          )}
        </div>
      </div>

      {/* Display appropriate tool controls */}
      {isCropping && (
        <CroppingTool
          ref={cropToolRef}
          imageUrl={previewUrl}
          onApply={handleApplyCrop}
          onCancel={cancelCrop}
        />
      )}

      {isBlurring && (
        <BlurBrushCanvas
          ref={blurCanvasRef}
          imageUrl={previewUrl}
          blurAmount={blurAmount}
          blurRadius={blurRadius}
          zoom={zoom}
          onApply={handleBlurApply}
          onCancel={cancelBlur}
          onBlurAmountChange={setBlurAmount}
          onBlurRadiusChange={setBlurRadius}
        />
      )}

      {isPainting && (
        <PaintTool
          ref={paintToolRef}
          imageUrl={previewUrl}
          onApplyPaint={handlePaintApply}
          onCancel={cancelPaint}
          onToggleEraser={() => setIsEraser(!isEraser)}
          isEraser={isEraser}
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
                {/* Show canvas based on edit mode */}
                {!isCropping && !isBlurring && !isPainting && (
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

          {!isEditMode && !isBlurring && !isPainting && !isCropping && (
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

              {/* Quality slider */}
              <div className="bg-gray-800 text-white border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Quality Settings</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm">Quality: {quality}%</label>
                  </div>
                  <Slider
                    min={30}
                    max={100}
                    step={5}
                    value={[quality]}
                    onValueChange={(values) => handleQualityChange(values[0])}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Lower quality = smaller file size.
                    {quality < 60
                      ? " Compression artifacts may be visible."
                      : ""}
                  </p>
                </div>
              </div>

              {hasEdited && <ImageZoomView imageUrl={previewUrl} />}
            </aside>
          )}
        </div>

        {/* Image Information Cards */}
        {!isEditMode && !isBlurring && !isPainting && !isCropping && (
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
