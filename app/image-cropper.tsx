"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import ImageControls from "./components/image-controls";
import BlurTool from "./components/blur-tool";
import PaintTool from "./components/paint-tool";
import ImageStatsDisplay from "./components/image-stats";
import { updateImage } from "@/app/utils/indexedDB";
import { Maximize2, Minus, Plus, MousePointer } from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

interface ImageCropperProps {
  image: ImageFile;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditing: boolean) => void; // Added this prop
}

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface MousePosition {
  x: number;
  y: number;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";

export default function ImageCropper({
  image,
  onUploadNew,
  onRemoveAll,
  onBackToGallery,
  isStandalone = false,
  onEditModeChange, // Added this prop
}: ImageCropperProps) {
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [format, setFormat] = useState<string>("jpeg");
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [isBlurring, setIsBlurring] = useState<boolean>(false);
  const [isPainting, setIsPainting] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>(PLACEHOLDER_IMAGE);
  const [zoom, setZoom] = useState<number>(1);
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [newStats, setNewStats] = useState<ImageStats | null>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<MousePosition | null>(
    null
  );
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [magnifierZoom, setMagnifierZoom] = useState<number>(3);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isEditMode, setIsEditMode] = useState<boolean>(isStandalone);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [resizeDebounceTimer, setResizeDebounceTimer] =
    useState<NodeJS.Timeout | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

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

  // Safe function to get file format
  const getFileFormat = (fileType: string | undefined): string => {
    if (!fileType || typeof fileType !== "string") return "unknown";
    const parts = fileType.split("/");
    return parts.length > 1 ? parts[1] : "unknown";
  };

  // Safe function to get MIME type
  const getMimeType = (format: string): string => {
    if (format === "webp") return "image/webp";
    if (format === "jpeg") return "image/jpeg";
    if (format === "png") return "image/png";
    return "image/png"; // Default fallback
  };

  // Initialize image when component mounts or image changes
  useEffect(() => {
    if (!isMounted) return;

    // Initialize with a safe URL
    const safeUrl =
      image?.url && typeof image.url === "string"
        ? image.url
        : PLACEHOLDER_IMAGE;

    setPreviewUrl(safeUrl);

    setCrop({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });

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
      setAspectRatio(img.width / img.height);
      setImageSize({ width: img.width, height: img.height });

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
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [image, isStandalone, isMounted]);

  // Update isEditMode when editing tools are activated
  useEffect(() => {
    if ((isCropping || isBlurring || isPainting) && !isEditMode) {
      setIsEditMode(true);
    }
  }, [isCropping, isBlurring, isPainting, isEditMode]);

  // Handle back to gallery
  // Handle back to gallery
  const handleBackToGallery = useCallback(() => {
    if (onBackToGallery) {
      onBackToGallery();
    } else {
      // If no handler provided, just go back to upload state
      onUploadNew();
    }
  }, [onBackToGallery, onUploadNew]);

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

  // Debounced resize function to prevent excessive renders
  const debouncedResize = useCallback(
    (applyOnly = false) => {
      if (resizeDebounceTimer) {
        clearTimeout(resizeDebounceTimer);
      }

      const timer = setTimeout(() => {
        handleResize(applyOnly);
      }, 300);

      setResizeDebounceTimer(timer);
    },
    [resizeDebounceTimer]
  );

  const handleResize = useCallback(
    (applyOnly = false) => {
      if (!imgRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = imgRef.current;

      // Set canvas dimensions to desired resize values
      canvas.width = width;
      canvas.height = height;

      // Draw the image with new dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Only update the preview URL if we're applying the changes
      if (applyOnly) {
        // Convert to blob and create URL
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Revoke previous URL to prevent memory leaks
              if (
                previewUrl &&
                previewUrl !== PLACEHOLDER_IMAGE &&
                image?.url &&
                previewUrl !== image.url
              ) {
                URL.revokeObjectURL(previewUrl);
              }
              const url = URL.createObjectURL(blob);
              setPreviewUrl(url);
              setHasEdited(true);

              // Update new stats
              setNewStats({
                width: width,
                height: height,
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
                saveEditedImage(url, blob);
              }
            }
          },
          getMimeType(format),
          0.9
        );
      }
    },
    [width, height, format, previewUrl, image, originalStats, isStandalone]
  );

  const handleCrop = useCallback(() => {
    if (!imgRef.current || !canvasRef.current || !completedCrop) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Revoke previous URL to prevent memory leaks
          if (
            previewUrl &&
            previewUrl !== PLACEHOLDER_IMAGE &&
            image?.url &&
            previewUrl !== image.url
          ) {
            URL.revokeObjectURL(previewUrl);
          }
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setIsCropping(false);
          setHasEdited(true);

          // Update dimensions after crop
          setWidth(completedCrop.width);
          setHeight(completedCrop.height);

          // Update new stats
          setNewStats({
            width: completedCrop.width,
            height: completedCrop.height,
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
            saveEditedImage(url, blob);
          }
        }
      },
      getMimeType(format),
      0.9
    );
  }, [
    imgRef,
    canvasRef,
    completedCrop,
    previewUrl,
    image,
    format,
    originalStats,
    isStandalone,
  ]);

  // Helper function to save edited image to IndexedDB
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
        await updateImage(image.id, {
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

  const handleBlurApply = useCallback(
    (blurredImageUrl: string) => {
      if (!blurredImageUrl || typeof blurredImageUrl !== "string") return;

      setPreviewUrl(blurredImageUrl);
      setIsBlurring(false);
      setHasEdited(true);

      // Get the blob from the URL to calculate size
      fetch(blurredImageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          // Update new stats
          if (imgRef.current) {
            setNewStats({
              width: imgRef.current.naturalWidth,
              height: imgRef.current.naturalHeight,
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
              saveEditedImage(blurredImageUrl, blob);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching blob:", error);
        });
    },
    [format, originalStats, isStandalone, saveEditedImage]
  );

  const handlePaintApply = useCallback(
    (paintedImageUrl: string) => {
      if (!paintedImageUrl || typeof paintedImageUrl !== "string") return;

      setPreviewUrl(paintedImageUrl);
      setIsPainting(false);
      setHasEdited(true);

      // Get the blob from the URL to calculate size
      fetch(paintedImageUrl)
        .then((response) => response.blob())
        .then((blob) => {
          // Update new stats
          if (imgRef.current) {
            setNewStats({
              width: imgRef.current.naturalWidth,
              height: imgRef.current.naturalHeight,
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
              saveEditedImage(paintedImageUrl, blob);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching blob:", error);
        });
    },
    [format, originalStats, isStandalone, saveEditedImage]
  );

  const downloadImage = useCallback(() => {
    if (!canvasRef.current || !image?.file?.name) return;

    const canvas = canvasRef.current;

    // If we haven't done any edits yet, draw the current image to canvas
    if (previewUrl === (image?.url || PLACEHOLDER_IMAGE)) {
      const ctx = canvas.getContext("2d");
      if (!ctx || !imgRef.current) return;

      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;

      ctx.drawImage(imgRef.current, 0, 0);
    }

    // Convert to the selected format
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
  }, [canvasRef, imgRef, previewUrl, image, format]);

  const resetImage = useCallback(() => {
    // Revoke previous URL to prevent memory leaks
    if (
      previewUrl &&
      previewUrl !== PLACEHOLDER_IMAGE &&
      image?.url &&
      previewUrl !== image.url
    ) {
      URL.revokeObjectURL(previewUrl);
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

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Handle mouse movement for the magnifier
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current || isCropping) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setMousePosition({ x, y });
    },
    [isCropping]
  );

  const handleMouseEnter = useCallback(() => {
    if (!isCropping && !isBlurring && !isPainting) {
      setIsHovering(true);
    }
  }, [isCropping, isBlurring, isPainting]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Increase magnifier zoom
  const increaseMagnifierZoom = useCallback(() => {
    setMagnifierZoom((prev) => Math.min(prev + 0.5, 6));
  }, []);

  // Decrease magnifier zoom
  const decreaseMagnifierZoom = useCallback(() => {
    setMagnifierZoom((prev) => Math.max(prev - 0.5, 1.5));
  }, []);

  // Get background position for the magnifier
  const getBackgroundPosition = useCallback(() => {
    if (isHovering && mousePosition) {
      // When hovering, use mouse position
      return `${mousePosition.x * 100}% ${mousePosition.y * 100}%`;
    } else {
      // Default to center when not hovering
      return "50% 50%";
    }
  }, [isHovering, mousePosition]);

  // Safe image URL for display
  const safeImageUrl = useCallback((url: string | undefined): string => {
    if (!url || typeof url !== "string") return PLACEHOLDER_IMAGE;
    return url;
  }, []);

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
        format={format}
        onFormatChange={setFormat}
        onToggleEditMode={toggleEditMode}
        onToggleCropping={toggleCropping}
        onToggleBlurring={toggleBlurring}
        onTogglePainting={togglePainting}
        onApplyCrop={handleCrop}
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
        onExitEditMode={exitEditMode} // Added this prop
        isStandalone={isStandalone}
      />

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
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {isCropping ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                  >
                    <img
                      ref={imgRef}
                      src={safeImageUrl(image?.url) || "/placeholder.svg"}
                      alt="Original image for cropping"
                      className="max-w-full"
                    />
                  </ReactCrop>
                ) : isBlurring ? (
                  <BlurTool
                    imageUrl={previewUrl}
                    onApplyBlur={handleBlurApply}
                    onCancel={cancelBlur}
                  />
                ) : isPainting ? (
                  <PaintTool
                    imageUrl={previewUrl}
                    onApplyPaint={handlePaintApply}
                    onCancel={cancelPaint}
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
                      src={safeImageUrl(previewUrl) || "/placeholder.svg"}
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
              <Card className="bg-gray-800 text-white border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resize</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="width" className="text-sm font-medium">
                        Width: {width}px
                      </label>
                    </div>
                    <Slider
                      id="width"
                      min={10}
                      max={imgRef.current?.naturalWidth || 1000}
                      step={1}
                      value={[width]}
                      className="[&>.slider-track]:bg-gray-500"
                      onValueChange={(value) => {
                        const newWidth = value[0];
                        setWidth(newWidth);

                        if (keepAspectRatio) {
                          const newHeight = Math.round(newWidth / aspectRatio);
                          setHeight(newHeight);
                        }

                        handleResize();
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="height" className="text-sm font-medium">
                        Height: {height}px
                      </label>
                    </div>
                    <Slider
                      id="height"
                      min={10}
                      max={imgRef.current?.naturalHeight || 1000}
                      step={1}
                      value={[height]}
                      className="[&>.slider-track]:bg-gray-500"
                      onValueChange={(value) => {
                        const newHeight = value[0];
                        setHeight(newHeight);

                        if (keepAspectRatio) {
                          const newWidth = Math.round(newHeight * aspectRatio);
                          setWidth(newWidth);
                        }

                        handleResize();
                      }}
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="keep-aspect-ratio"
                      checked={keepAspectRatio}
                      onCheckedChange={setKeepAspectRatio}
                    />
                    <label
                      htmlFor="keep-aspect-ratio"
                      className="text-sm font-medium"
                    >
                      Keep aspect ratio
                    </label>
                  </div>

                  <Button onClick={() => handleResize(true)} className="w-full">
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Apply Resize
                  </Button>
                </CardContent>
              </Card>

              {hasEdited && !isBlurring && !isCropping && !isPainting && (
                <Card className="bg-gray-800 text-white border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-base">Zoom View</span>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={decreaseMagnifierZoom}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-xs">
                          {magnifierZoom.toFixed(1)}x
                        </span>
                        <Button
                          onClick={increaseMagnifierZoom}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${safeImageUrl(previewUrl)})`,
                          backgroundPosition: getBackgroundPosition(),
                          backgroundSize: `${magnifierZoom * 100}%`,
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative">
                            {/* Crosshair */}
                            <div className="absolute w-[1px] h-16 bg-red-500 left-1/2 -translate-x-1/2"></div>
                            <div className="absolute h-[1px] w-16 bg-red-500 top-1/2 -translate-y-1/2"></div>
                            <div className="w-16 h-16 rounded-sm border border-red-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                          </div>
                        </div>
                        {!isHovering && (
                          <div className="absolute bottom-2 left-0 right-0 text-center">
                            <p className="text-xs text-white bg-black bg-opacity-50 py-1 px-2 rounded-md inline-block">
                              <MousePointer className="h-3 w-3 inline mr-1" />
                              Mouse over image to navigate
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </aside>
          )}
        </div>

        {/* Image Information Cards */}
        {!isEditMode && !isBlurring && !isPainting && (
          <ImageStatsDisplay
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
