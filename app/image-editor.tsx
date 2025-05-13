// Updated image-editor.tsx to always display pagination with multiple photos

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
  Upload,
  Trash2,
  Eraser,
  Download,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CroppingTool, { type CroppingToolRef } from "./components/cropping-tool";
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
} from "@/types/types";
import { useTheme } from "next-themes";

export default function ImageEditor({
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
  // Additional props for enhanced pagination
  allImages = [],
  currentImageId = "",
  onSelectImage,
}: ImageEditorProps) {
  // Editor state
  const [editorState, setEditorState] = useState<EditorMode>("view");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Tool states
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [format, setFormat] = useState<string>("jpeg");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);

  // Image stats
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [originalStats, setOriginalStats] = useState<any>(null);
  const [newStats, setNewStats] = useState<any>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);

  // History states
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropToolRef = useRef<CroppingToolRef>(null);
  const blurCanvasRef = useRef<any>(null);
  const paintToolRef = useRef<any>(null);
  const textToolRef = useRef<any>(null);

  // Wait for component to mount to avoid hydration issues with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = useCallback(() => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  }, [mounted, theme, setTheme]);

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
  }, [imageUrl, fileSize, fileType]);

  // Reset editor state when image changes via pagination
  useEffect(() => {
    setEditorState("view");
    setZoom(1);
    setIsEraser(false);
    setHistory([imageUrl]);
    setHistoryIndex(0);
    setHasEdited(false);
    setNewStats(null);
    setDataSavings(0);
  }, [imageUrl]);

  // Handle resize
  const handleResize = useCallback((newWidth: number, newHeight: number) => {
    if (!imgRef.current) return;

    setWidth(newWidth);
    setHeight(newHeight);
    setIsCompressing(true);
  }, []);

  // Apply resize
  const handleApplyResize = useCallback(async () => {
    if (!imgRef.current || !originalStats) return;

    try {
      // Calculate new size (simplified estimation)
      const areaRatio =
        (width * height) / (originalStats.width * originalStats.height);
      const newSize = Math.floor(originalStats.size * Math.max(areaRatio, 0.6));

      // Update stats
      setNewStats({
        width,
        height,
        size: newSize,
        format: format,
      });

      // Calculate data savings
      const savings = 100 - (newSize / originalStats.size) * 100;
      setDataSavings(savings);
      setHasEdited(true);

      // Add to history
      addToHistory(imageUrl);

      // Notify parent if needed
      if (onImageChange) {
        onImageChange(imageUrl);
      }

      // Exit compression mode after a delay
      setTimeout(() => {
        setIsCompressing(false);
      }, 800);
    } catch (error) {
      console.error("Error applying resize:", error);
      setIsCompressing(false);
    }
  }, [width, height, format, originalStats, imageUrl, onImageChange]);

  // History management
  const addToHistory = useCallback(
    (url: string) => {
      setHistory((prev) => {
        // If we're not at the end of history, remove everything after current index
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, url];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

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
        setEditorState("edit"); // Return to edit mode after applying crop

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
        setEditorState("edit"); // Return to edit mode after applying blur

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
        setEditorState("edit"); // Return to edit mode after applying paint

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
        setEditorState("edit"); // Return to edit mode after applying text

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
    if (!canvasRef.current) return;

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
          const fileNameWithoutExt = fileName.split(".")[0] || "image";
          a.download = `${fileNameWithoutExt}-edited.${
            format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png"
          }`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      `image/${format}`,
      0.9
    );

    if (onDownload) {
      onDownload();
    }
  }, [imgRef, canvasRef, fileName, format, onDownload]);

  // Zoom in/out functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Handle image rotation
  const handleRotateClockwise = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions swapped for rotation
    canvas.width = imgRef.current.naturalHeight;
    canvas.height = imgRef.current.naturalWidth;

    // Transform and rotate
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(
      imgRef.current,
      -imgRef.current.naturalWidth / 2,
      -imgRef.current.naturalHeight / 2
    );

    // Get the rotated image
    const rotatedImageUrl = canvas.toDataURL(`image/${format}`);

    // Update dimensions
    setWidth(canvas.width);
    setHeight(canvas.height);

    // Add to history
    addToHistory(rotatedImageUrl);

    // Notify parent component
    if (onImageChange) {
      onImageChange(rotatedImageUrl);
    }
  }, [imgRef, canvasRef, format, onImageChange, addToHistory]);

  const handleRotateCounterClockwise = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions swapped for rotation
    canvas.width = imgRef.current.naturalHeight;
    canvas.height = imgRef.current.naturalWidth;

    // Transform and rotate
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.drawImage(
      imgRef.current,
      -imgRef.current.naturalWidth / 2,
      -imgRef.current.naturalHeight / 2
    );

    // Get the rotated image
    const rotatedImageUrl = canvas.toDataURL(`image/${format}`);

    // Update dimensions
    setWidth(canvas.width);
    setHeight(canvas.height);

    // Add to history
    addToHistory(rotatedImageUrl);

    // Notify parent component
    if (onImageChange) {
      onImageChange(rotatedImageUrl);
    }
  }, [imgRef, canvasRef, format, onImageChange, addToHistory]);

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Toolbar - with states as requested */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        {/* resizeAndOptimize state toolbar */}
        {editorState === "view" && (
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
                onClick={() => setEditorState("edit")}
                variant="outline"
                className="h-9"
                data-testid="edit-image-button"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Image Mode
              </Button>

              <Button
                onClick={() => {
                  /* Disabled */
                }}
                variant="outline"
                className="h-9 opacity-50"
                disabled
              >
                <Images className="mr-2 h-4 w-4" />
                Multi Edit
              </Button>

              {/* ALWAYS add SimplePagination component */}
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
        {/* editImage state toolbar with 3-column grid layout */}
        {editorState === "edit" && (
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
                onClick={() => setEditorState("view")}
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
                    onClick={() => setEditorState("edit")}
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
                    onClick={() => setEditorState("edit")}
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
                    onClick={() => setIsEraser(!isEraser)}
                    variant={isEraser ? "default" : "outline"}
                    className="h-9"
                  >
                    <Eraser className="mr-2 h-4 w-4" />
                    {isEraser ? "Brush" : "Eraser"}
                  </Button>
                  <Button
                    onClick={() => setEditorState("edit")}
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
                    onClick={() => setEditorState("edit")}
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
            <input
              id="blur-amount"
              type="range"
              min="1"
              max="20"
              value={blurAmount}
              onChange={(e) => setBlurAmount(parseInt(e.target.value))}
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
            <input
              id="blur-radius"
              type="range"
              min="5"
              max="50"
              value={blurRadius}
              onChange={(e) => setBlurRadius(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      )}

      {editorState === "paint" && (
        <div className="flex items-center gap-4 p-2 bg-gray-700 rounded-lg mb-4">
          <div className="flex-1">
            <label
              htmlFor="brush-size"
              className="text-sm font-medium block mb-1 text-white"
            >
              Brush Size: {brushSize}px
            </label>
            <input
              id="brush-size"
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white mr-2">
              Color:
            </label>
            <div className="flex gap-1">
              {[
                "#ff0000",
                "#00ff00",
                "#0000ff",
                "#ffff00",
                "#ff00ff",
                "#00ffff",
                "#ffffff",
                "#000000",
              ].map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full border ${
                    brushColor === color ? "border-white" : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              ))}
            </div>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="h-8 w-8 ml-2 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main editing area */}
          <section className="md:col-span-3">
            <div className="space-y-2">
              <div className="relative border rounded-lg overflow-hidden">
                {editorState === "crop" ? (
                  <CroppingTool
                    ref={cropToolRef}
                    imageUrl={imageUrl}
                    onApply={handleCropResult}
                    onCancel={() => setEditorState("edit")}
                  />
                ) : editorState === "blur" ? (
                  <BlurBrushCanvas
                    ref={blurCanvasRef}
                    imageUrl={imageUrl}
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    zoom={zoom}
                    onApply={handleBlurResult}
                    onCancel={() => setEditorState("edit")}
                    onBlurAmountChange={setBlurAmount}
                    onBlurRadiusChange={setBlurRadius}
                  />
                ) : editorState === "paint" ? (
                  <PaintTool
                    ref={paintToolRef}
                    imageUrl={imageUrl}
                    onApplyPaint={handlePaintResult}
                    onCancel={() => setEditorState("edit")}
                    onToggleEraser={() => setIsEraser(!isEraser)}
                    isEraser={isEraser}
                  />
                ) : editorState === "text" ? (
                  <TextTool
                    ref={textToolRef}
                    imageUrl={imageUrl}
                    onApplyText={handleTextResult}
                    onCancel={() => setEditorState("edit")}
                    setEditorState={(state: string) =>
                      setEditorState(state as EditorMode)
                    } // Fixed with adapter
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

          {/* Sidebar with controls - FIXED for consistent behavior */}
          <aside className="md:col-span-1 space-y-6">
            {/* Only show these elements in "view" mode */}
            {editorState === "view" && (
              <>
                <ImageResizer
                  width={width}
                  height={height}
                  maxWidth={originalStats?.width || 1000}
                  maxHeight={originalStats?.height || 1000}
                  onResize={handleResize}
                  onApplyResize={handleApplyResize}
                  format={format}
                  onFormatChange={setFormat}
                  onDownload={handleDownload}
                  isCompressing={isCompressing}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onNavigateImage={onNavigateImage}
                />

                {/* Show ImageZoomView in view mode if the image has been edited */}
                {hasEdited && <ImageZoomView imageUrl={imageUrl} />}
              </>
            )}
          </aside>
        </div>

        {/* Image Information Cards - only shown in view mode */}
        {editorState === "view" && originalStats && (
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
}
