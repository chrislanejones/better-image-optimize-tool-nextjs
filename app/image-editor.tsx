// Updated image-editor.tsx with full-width edit mode, fixed Core Web Vitals scoring, and proper mode transitions
import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import CroppingTool from "./components/cropping-tool";
import BlurBrushCanvas from "./components/blur-tool";
import PaintTool from "./components/paint-tool";
import TextTool from "./components/text-tool";
import ImageResizer from "./components/image-resizer";
import ImageStats from "./components/image-stats";
import ImageZoomView from "./components/image-zoom-view";
import SimplePagination from "./components/pagination-controls";
import {
  ImageEditorProps,
  NavigationDirection,
  ImageInfo,
  EditorMode,
  CroppingToolRef,
  ExtendedImageEditorProps,
} from "@/types/types";
import { useTheme } from "next-themes";
import {
  rotateImage,
  compressImage,
  getBlobFromUrl,
  normalizeQuality,
} from "./utils/image-transformations";

export type EditorState =
  | "resizeAndOptimize"
  | "editImage"
  | "multiImageEdit"
  | "crop"
  | "blur"
  | "paint"
  | "text";

const ImageEditor: React.FC<ExtendedImageEditorProps> = ({
  imageUrl,
  onImageChange,
  onReset,
  onDownload,
  onClose,
  className,
  fileName = "image.png",
  fileType = "image/png",
  fileSize = 0,
  currentPage = 1,
  totalPages = 1,
  onNavigateImage,
  onRemoveAll,
  onUploadNew,
  allImages = [],
  currentImageId = "",
  onSelectImage,
  onEditModeChange,
}) => {
  // ✅ You had an outer ImageEditor which used imageUrl too early (removed)
  const [editorState, setEditorState] =
    useState<EditorState>("resizeAndOptimize");
  const [zoom, setZoom] = useState(1);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [padlockAnimation, setPadlockAnimation] = useState(false);
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentImage, setCurrentImage] = useState<string>(imageUrl);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    setCurrentImage(imageUrl);
    setHistory([imageUrl]);
    setHistoryIndex(0);
  }, [imageUrl]);

  // Tool states
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [format, setFormat] = useState<string>("webp"); // Default to WebP for better Core Web Vitals
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(85);
  const [isRotating, setIsRotating] = useState<boolean>(false);

  // Image stats
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [originalStats, setOriginalStats] = useState<any>(null);
  const [newStats, setNewStats] = useState<any>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);

  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropToolRef = useRef<CroppingToolRef>(null);
  const blurCanvasRef = useRef<any>(null);
  const paintToolRef = useRef<any>(null);
  const textToolRef = useRef<any>(null);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const { toast } = useToast();

  // History management

  const addToHistory = useCallback(
    (url: string) => {
      setHistory((prev) => {
        // If we're not at the end of history, remove everything after current index
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, url];
      });
      setHistoryIndex((prev) => prev + 1);

      // If there's code here that's changing editorState, it needs to be removed or controlled
    },
    [historyIndex]
  );

  useEffect(() => {
    if (imageUrl) {
      setHistory([imageUrl]);
      setHistoryIndex(0);
    }
  }, [imageUrl]);

  const handleRotateClockwise = useCallback(async () => {
    setIsRotating(true);
    const rotatedUrl = await rotateImage(currentImage ?? "", 90);
    onImageChange?.(rotatedUrl);
    addToHistory(rotatedUrl);
    setIsRotating(false);
    setHasEdited(true);
  }, [currentImage, onImageChange, addToHistory]);

  const handleRotateCounterClockwise = useCallback(async () => {
    setIsRotating(true);
    const rotatedUrl = await rotateImage(currentImage ?? "", -90);
    onImageChange?.(rotatedUrl);
    addToHistory(rotatedUrl);
    setIsRotating(false);
    setHasEdited(true);
  }, [currentImage, onImageChange, addToHistory]);
  // Wait for component to mount to avoid hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  }, [mounted, theme, setTheme]);

  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(
        editorState === "editImage" ||
          editorState === "multiImageEdit" ||
          editorState === "crop" ||
          editorState === "blur" ||
          editorState === "paint" ||
          editorState === "text"
      );
    }
  }, [editorState, onEditModeChange]);
  // Play padlock animation when entering edit mode
  useEffect(() => {
    if (editorState === "editImage" || editorState === "multiImageEdit") {
      setPadlockAnimation(true);
      const timer = setTimeout(() => {
        setPadlockAnimation(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [editorState]);

  // Update Core Web Vitals score based on format and dimensions
  const updateCoreWebVitalsScore = useCallback(() => {
    if (!originalStats) return;

    const originalSize = originalStats.width * originalStats.height;
    const currentSize = width * height;

    let compressionRatio = 1.0;
    if (format === "webp") {
      compressionRatio = 0.65;
    } else if (format === "jpeg") {
      compressionRatio = 1.0;
    } else if (format === "png") {
      compressionRatio = 1.5;
    }

    const qualityFactor = quality / 85;
    compressionRatio *= qualityFactor;

    const estimatedSize = currentSize * compressionRatio;
    const originalFileSize = originalStats.size;
    const estimatedFileSize = (estimatedSize / originalSize) * originalFileSize;

    setNewStats({
      width,
      height,
      estimatedFileSize,
    });

    const savings = originalFileSize - estimatedFileSize;
    setDataSavings((savings / originalFileSize) * 100);
  }, [width, height, format, quality, originalStats]);

  // Initialize image dimensions and stats
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: fileSize,
        format: fileType.split("/")[1] || "unknown",
      });
    };
    img.src = imageUrl;

    // Reset compressing state whenever image changes
    setIsCompressing(false);
  }, [imageUrl, fileSize, fileType]);

  // Reset editor state when image changes via pagination
  useEffect(() => {
    // Don't reset if we're just rotating the image
    if (!isRotating) {
      // ADD THIS CONDITION
      setEditorState("resizeAndOptimize");
      setZoom(1);
      setIsEraser(false);
      setHistory([imageUrl]);
      setHistoryIndex(0);
      setHasEdited(false);
      setNewStats(null);
      setDataSavings(0);
    }
  }, [imageUrl, isRotating]);

  // Handle format change
  const handleFormatChange = useCallback(
    (newFormat: string) => {
      setFormat(newFormat);
      // Update Core Web Vitals score when format changes
      updateCoreWebVitalsScore();
    },
    [updateCoreWebVitalsScore]
  );

  // Handle resize
  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      if (!imgRef.current) return;

      // Set dimensions
      setWidth(newWidth);
      setHeight(newHeight);

      // IMPORTANT: Don't automatically set isCompressing to true
      // setIsCompressing(true); <- REMOVE THIS LINE

      // Always update the Core Web Vitals score when dimensions change
      // This ensures stats update in real-time as sliders move
      updateCoreWebVitalsScore();

      // Mark that dimensions have changed from original
      if (
        originalStats &&
        (newWidth !== originalStats.width || newHeight !== originalStats.height)
      ) {
        setHasEdited(true);
      }
    },
    [updateCoreWebVitalsScore, originalStats]
  );

  // Handle quality change
  const handleQualityChange = useCallback(
    (newQuality: number) => {
      setQuality(newQuality);
      // Update Core Web Vitals score when quality changes
      updateCoreWebVitalsScore();
    },
    [updateCoreWebVitalsScore]
  );

  // Apply resize
  const handleApplyResize = useCallback(async () => {
    console.log("🔍 handleApplyResize called in image-editor.tsx");

    if (!imgRef.current || !originalStats) {
      return;
    }

    try {
      // Start compression
      setIsCompressing(true);

      // Simulate progress steps for better UX
      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 5;
        setCompressionProgress(progress);
        if (progress >= 95) {
          clearInterval(progressTimer);
        }
      }, 100);

      console.log(
        `Applying resize to ${width}x${height} with format ${format} and quality ${quality}`
      );

      // Actually perform the compression and resize using the utility function
      const result = await compressImage(
        imageUrl,
        format,
        quality,
        width // Pass the target width to enable resizing
      );

      // Get the compressed result
      const {
        url: compressedUrl,
        blob,
        width: newWidth,
        height: newHeight,
      } = result;

      console.log(
        `Compression result: ${(blob.size / 1024).toFixed(
          2
        )} KB, ${newWidth}x${newHeight}`
      );

      // Update dimensions in case they changed during compression
      setWidth(newWidth);
      setHeight(newHeight);

      // Set final progress
      setCompressionProgress(100);

      // Update the preview with the new compressed image
      if (onImageChange) {
        onImageChange(compressedUrl);
      }

      // Update stats - this ensures ImageStats component gets updated
      const updatedStats = {
        width: newWidth,
        height: newHeight,
        size: blob.size,
        format,
      };

      setNewStats(updatedStats);

      // Calculate data savings
      const savings = originalStats
        ? 100 - (blob.size / originalStats.size) * 100
        : 0;
      setDataSavings(savings);

      // Important: Mark as edited so stats are displayed
      setHasEdited(true);

      // Add to history
      addToHistory(compressedUrl);

      // Exit compression mode after a delay
      setTimeout(() => {
        setIsCompressing(false);
        setCompressionProgress(0);

        // Version 1: Simple string message
        toast({
          title: `Image optimized! Reduced file size by ${Math.round(
            savings
          )}% to ${(blob.size / 1024).toFixed(0)} KB`,
          variant: "default",
        });
      }, 800);
    } catch (error) {
      console.error("Error applying resize:", error);
      setIsCompressing(false);
      setCompressionProgress(0);

      // Simple error toast
      toast({
        title:
          "Compression error. Failed to compress the image. Please try again.",
        variant: "destructive",
      });

      // Or with title only if supported
      // toast({
      //   title: "Compression error. Failed to compress the image. Please try again.",
      //   variant: "destructive"
      // });
    }
  }, [
    imgRef,
    width,
    height,
    format,
    quality,
    originalStats,
    imageUrl,
    onImageChange,
    addToHistory,
    toast,
  ]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevUrl = history[newIndex];

      // Update the image
      if (onImageChange && prevUrl) {
        onImageChange(prevUrl);
      }
    }
  }, [history, historyIndex, onImageChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextUrl = history[newIndex];

      // Update the image
      if (onImageChange && nextUrl) {
        onImageChange(nextUrl);
      }
    }
  }, [history, historyIndex, onImageChange]);

  // Apply crop
  const handleApplyCrop = useCallback(() => {
    if (cropToolRef.current) {
      cropToolRef.current.applyCrop();
    }
  }, [cropToolRef]);

  const handleCropResult = useCallback(
    (croppedImageUrl: string) => {
      if (!croppedImageUrl) return;

      // Get image dimensions and update stats
      const img = new Image();
      img.src = croppedImageUrl;

      img.onload = async () => {
        // Update dimensions
        setWidth(img.width);
        setHeight(img.height);

        // Estimate blob size (in a real implementation, we would get this from the actual blob)
        const estimatedSize = originalStats
          ? Math.round(
              ((img.width * img.height) /
                (originalStats.width * originalStats.height)) *
                originalStats.size
            )
          : 0;

        setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: format,
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (estimatedSize / originalStats.size) * 100;
          setDataSavings(savings);
        }

        setHasEdited(true);
        setEditorState("editImage"); // Return to edit mode after applying crop

        // Add to history
        addToHistory(croppedImageUrl);

        // Notify parent component
        if (onImageChange) {
          onImageChange(croppedImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange, addToHistory]
  );

  // Apply blur
  const handleApplyBlur = useCallback(() => {
    if (blurCanvasRef.current) {
      const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
      if (dataUrl) handleBlurResult(dataUrl);
    }
  }, [blurCanvasRef]);

  const handleBlurResult = useCallback(
    (blurredImageUrl: string) => {
      if (!blurredImageUrl) return;

      // Get image dimensions and update stats
      const img = new Image();
      img.src = blurredImageUrl;

      img.onload = async () => {
        // Update dimensions
        setWidth(img.width);
        setHeight(img.height);

        // Estimate blob size (in a real implementation, we would get this from the actual blob)
        const estimatedSize = originalStats
          ? // Blurring often reduces file size slightly due to lower detail
            Math.round(originalStats.size * 0.9)
          : 0;

        setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: format,
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (estimatedSize / originalStats.size) * 100;
          setDataSavings(savings);
        }

        setHasEdited(true);
        setEditorState("editImage"); // Always return to edit mode after applying blur

        // Add to history
        addToHistory(blurredImageUrl);

        // Notify parent component
        if (onImageChange) {
          onImageChange(blurredImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange, addToHistory]
  );

  // Apply paint
  const handleApplyPaint = useCallback(() => {
    if (paintToolRef.current) {
      const dataUrl = paintToolRef.current.getCanvasDataUrl();
      if (dataUrl) handlePaintResult(dataUrl);
    }
  }, [paintToolRef]);

  const handlePaintResult = useCallback(
    (paintedImageUrl: string) => {
      if (!paintedImageUrl) return;

      // Get image dimensions and update stats
      const img = new Image();
      img.src = paintedImageUrl;

      img.onload = async () => {
        // Update dimensions
        setWidth(img.width);
        setHeight(img.height);

        // Estimate blob size (in a real implementation, we would get this from the actual blob)
        const estimatedSize = originalStats
          ? // Painting may increase file size slightly due to added detail
            Math.round(originalStats.size * 1.05)
          : 0;

        setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: format,
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (estimatedSize / originalStats.size) * 100;
          setDataSavings(savings);
        }

        setHasEdited(true);
        setEditorState("editImage"); // Always return to edit mode after applying paint

        // Add to history
        addToHistory(paintedImageUrl);

        // Notify parent component
        if (onImageChange) {
          onImageChange(paintedImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange, addToHistory]
  );

  // Apply text
  const handleApplyText = useCallback(() => {
    if (textToolRef.current) {
      textToolRef.current.applyText();
    }
  }, [textToolRef]);

  const handleTextResult = useCallback(
    (textedImageUrl: string) => {
      if (!textedImageUrl) return;

      // Get image dimensions and update stats
      const img = new Image();
      img.src = textedImageUrl;

      img.onload = async () => {
        // Update dimensions
        setWidth(img.width);
        setHeight(img.height);

        // Estimate blob size (in a real implementation, we would get this from the actual blob)
        const estimatedSize = originalStats
          ? // Text may increase file size slightly
            Math.round(originalStats.size * 1.02)
          : 0;

        setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: format,
        });

        // Calculate data savings
        if (originalStats) {
          const savings = 100 - (estimatedSize / originalStats.size) * 100;
          setDataSavings(savings);
        }

        setHasEdited(true);
        setEditorState("editImage"); // Always return to edit mode after applying text

        // Add to history
        addToHistory(textedImageUrl);

        // Notify parent component
        if (onImageChange) {
          onImageChange(textedImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange, addToHistory]
  );

  // Reset image
  const handleReset = useCallback(() => {
    setHasEdited(false);
    setNewStats(null);
    setDataSavings(0);

    // Reset dimensions to original
    if (originalStats) {
      setWidth(originalStats.width);
      setHeight(originalStats.height);
    }

    // Reset history
    setHistory([imageUrl]);
    setHistoryIndex(0);

    if (onReset) {
      onReset();
    }
  }, [originalStats, onReset, imageUrl]);

  // Download image
  const handleDownload = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;

    try {
      // Start a small loading indicator
      setIsCompressing(true);
      setCompressionProgress(50);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Set canvas dimensions to match current image
      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;

      // Draw the current image to canvas
      ctx.drawImage(imgRef.current, 0, 0);

      // Get the correct file extension
      const extension =
        format === "webp" ? "webp" : format === "png" ? "png" : "jpg";

      // Convert quality from 0-100 to 0-1
      const normalizedQuality = quality / 100;

      // Convert to the selected format and download
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Failed to create blob");
          }

          console.log(
            `Downloaded image size: ${(blob.size / 1024).toFixed(2)} KB`
          );

          // Create download link
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const fileNameWithoutExt = fileName.split(".")[0] || "image";
          a.download = `${fileNameWithoutExt}-edited.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // End loading state
          setIsCompressing(false);
          setCompressionProgress(0);

          // Show success notification with simple string
          toast({
            title: `Download complete! File saved as ${format.toUpperCase()}, ${(
              blob.size / 1024
            ).toFixed(0)} KB`,
            variant: "default",
          });

          // Or with title only if supported
          // toast({
          //   title: `Download complete! File saved as ${format.toUpperCase()}, ${(blob.size / 1024).toFixed(0)} KB`
          // });
        },
        getMimeType(format),
        normalizedQuality
      );

      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      setIsCompressing(false);
      setCompressionProgress(0);

      // Show error toast
      toast({
        title:
          "Download error. Failed to download the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [imgRef, canvasRef, fileName, format, quality, onDownload, toast]);
  // Zoom in/out functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  function getMimeType(format: string): string {
    if (format === "webp") return "image/webp";
    if (format === "jpeg") return "image/jpeg";
    if (format === "png") return "image/png";
    return "image/jpeg"; // Default fallback
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Padlock in edit mode where gallery would be - ABOVE the toolbar */}
      {(editorState === "editImage" || editorState === "multiImageEdit") && (
        <div
          className={`w-full flex justify-center items-center mb-4
            ${padlockAnimation ? "animate-pulse" : ""}`}
        >
          <div className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-gray-600 border border-gray-500">
            <Lock
              className={`h-4 w-4 ${
                padlockAnimation ? "text-yellow-300" : "text-white"
              }`}
            />
            <span className="font-medium">Edit Image Mode</span>
          </div>
        </div>
      )}

      {/* Toolbar - with states as requested */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        {/* resizeAndOptimize state toolbar */}
        {editorState === "resizeAndOptimize" && (
          <>
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <Button
                onClick={handleZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => setEditorState("editImage")}
                variant="outline"
                className="h-9"
                data-testid="edit-image-button"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Image Mode
              </Button>

              <Button
                onClick={() => {
                  /* Disabled - will be implemented in the future */
                }}
                variant="outline"
                className="h-9 opacity-50"
                disabled
              >
                <Images className="mr-2 h-4 w-4" />
                Multi Edit
              </Button>

              {/* ALWAYS add SimplePagination component in resizeAndOptimize mode */}
              {onNavigateImage && (
                <SimplePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onNavigate={onNavigateImage}
                  className="ml-2"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleReset} variant="outline" className="h-9">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              {/* Back to gallery - renamed */}
              {onClose && (
                <Button onClick={onClose} variant="outline" className="h-9">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Upload
                </Button>
              )}

              {/* Remove all */}
              {onRemoveAll && (
                <Button
                  onClick={onRemoveAll}
                  variant="destructive"
                  className="h-9"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove All Images
                </Button>
              )}

              {/* Theme button */}
              {mounted && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                >
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              )}

              {/* User button - disabled */}
              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-9 w-9"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* editImage state toolbar without centered padlock */}
        {editorState === "editImage" && (
          <div className="w-full grid grid-cols-3 items-center">
            {/* Left section - icons only, no text */}
            <div className="flex items-center gap-2 justify-self-start">
              <Button
                onClick={handleZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Zoom Out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Zoom In"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleUndo}
                variant="outline"
                className="h-9 w-9 p-0"
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                variant="outline"
                className="h-9 w-9 p-0"
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRotateCounterClockwise}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Rotate Left"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRotateClockwise}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Rotate Right"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Center section - state changing buttons with text */}
            <div className="flex items-center gap-2 justify-self-center">
              <Button
                onClick={() => setEditorState("crop")}
                variant="outline"
                className="h-9"
              >
                <Crop className="mr-2 h-4 w-4" />
                Crop Image
              </Button>
              <Button
                onClick={() => setEditorState("blur")}
                variant="outline"
                className="h-9"
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>
              <Button
                onClick={() => setEditorState("paint")}
                variant="outline"
                className="h-9"
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>
              <Button
                onClick={() => setEditorState("text")}
                variant="outline"
                className="h-9"
              >
                <Type className="mr-2 h-4 w-4" />
                Text Tool
              </Button>
            </div>

            {/* Right section - Exit button */}
            <div className="flex items-center gap-2 justify-self-end">
              <Button
                onClick={() => setEditorState("resizeAndOptimize")}
                variant="outline"
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" />
                Exit Edit Mode
              </Button>
            </div>
          </div>
        )}

        {/* Tool-specific states */}
        {(editorState === "crop" ||
          editorState === "blur" ||
          editorState === "paint" ||
          editorState === "text") && (
          <>
            <div className="flex items-center gap-2">
              {/* Zoom controls */}
              <Button
                onClick={handleZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {/* Tool-specific controls */}
              {editorState === "crop" && (
                <>
                  <Button
                    onClick={handleApplyCrop}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Crop
                  </Button>
                  <Button
                    onClick={() => setEditorState("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "blur" && (
                <>
                  <Button
                    onClick={handleApplyBlur}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Blur
                  </Button>
                  <Button
                    onClick={() => setEditorState("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "paint" && (
                <>
                  <Button
                    onClick={handleApplyPaint}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Paint
                  </Button>
                  <Button
                    onClick={() => setEditorState("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "text" && (
                <>
                  <Button
                    onClick={handleApplyText}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Text
                  </Button>
                  <Button
                    onClick={() => setEditorState("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tool-specific secondary toolbars */}
      {editorState === "blur" && (
        <div className="flex items-center gap-4 p-2 bg-gray-700 rounded-lg mb-4">
          <div className="flex-1">
            <label
              htmlFor="blur-amount"
              className="text-sm font-medium block mb-1 text-white"
            >
              Blur Amount: {blurAmount}px
            </label>
            <Slider
              id="blur-amount"
              min={1}
              max={20}
              step={1}
              value={[blurAmount]}
              onValueChange={(values) => setBlurAmount(values[0])}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="blur-radius"
              className="text-sm font-medium block mb-1 text-white"
            >
              Brush Size: {blurRadius}px
            </label>
            <Slider
              id="blur-radius"
              min={5}
              max={50}
              step={1}
              value={[blurRadius]}
              onValueChange={(values) => setBlurRadius(values[0])}
              className="w-full"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main editing area - Full width in editImage/crop/blur/paint/text mode */}
          <section
            className={`${
              editorState !== "resizeAndOptimize"
                ? "col-span-full"
                : "md:col-span-3"
            }`}
          >
            <div className="space-y-2">
              <div className="relative border rounded-lg overflow-hidden">
                {editorState === "crop" ? (
                  <CroppingTool
                    ref={cropToolRef}
                    imageUrl={imageUrl}
                    onApply={handleCropResult}
                    onCancel={() => setEditorState("editImage")}
                  />
                ) : editorState === "blur" ? (
                  <BlurBrushCanvas
                    ref={blurCanvasRef}
                    imageUrl={imageUrl}
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    zoom={zoom}
                    onApply={handleBlurResult}
                    onCancel={() => setEditorState("editImage")}
                    onBlurAmountChange={setBlurAmount}
                    onBlurRadiusChange={setBlurRadius}
                  />
                ) : editorState === "paint" ? (
                  <PaintTool
                    ref={paintToolRef}
                    imageUrl={imageUrl}
                    onApplyPaint={handlePaintResult}
                    onCancel={() => setEditorState("editImage")}
                    onToggleEraser={() => setIsEraser(!isEraser)}
                    isEraser={isEraser}
                  />
                ) : editorState === "text" ? (
                  <TextTool
                    ref={textToolRef}
                    imageUrl={imageUrl}
                    onApplyText={handleTextResult}
                    onCancel={() => setEditorState("editImage")}
                    setEditorState={(state: string) =>
                      setEditorState(state as EditorState)
                    }
                    setBold={setIsBold}
                    setItalic={setIsItalic}
                  />
                ) : (
                  <div
                    className="overflow-auto"
                    style={{
                      maxHeight: "700px",
                      height: "70vh",
                    }}
                  >
                    <img
                      ref={imgRef}
                      src={imageUrl}
                      alt="Edited image"
                      className="max-w-full transform origin-top-left"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Sidebar - Only shown in resizeAndOptimize mode */}
          {editorState === "resizeAndOptimize" && (
            <aside className="md:col-span-1 space-y-6">
              <ImageResizer
                width={width}
                height={height}
                maxWidth={originalStats?.width || 1000}
                maxHeight={originalStats?.height || 1000}
                onResize={handleResize}
                onApplyResize={handleApplyResize}
                format={format}
                onFormatChange={handleFormatChange}
                onDownload={handleDownload}
                isCompressing={isCompressing}
                currentPage={currentPage}
                totalPages={totalPages}
                onNavigateImage={onNavigateImage}
                quality={quality}
                onQualityChange={handleQualityChange}
              />

              {/* Show ImageZoomView in view mode if the image has been edited */}
              {hasEdited && <ImageZoomView imageUrl={imageUrl} />}
            </aside>
          )}
        </div>

        {/* Image Information Cards - only shown in resizeAndOptimize mode */}
        {editorState === "resizeAndOptimize" && originalStats && (
          <ImageStats
            originalStats={originalStats}
            newStats={newStats}
            dataSavings={dataSavings}
            hasEdited={hasEdited}
            fileName={fileName}
            format={format}
            fileType={fileType}
          />
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageEditor;
