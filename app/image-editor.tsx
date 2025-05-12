"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Crop,
  Droplets,
  Paintbrush,
  Eraser,
  Download,
  RefreshCw,
  ArrowLeft,
  Type,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Pencil,
} from "lucide-react";
import Toolbar from "./components/toolbar";
import CroppingTool, { CroppingToolRef } from "./components/cropping-tool";
import BlurBrushCanvas from "./components/blur-tool";
import PaintTool from "./components/paint-tool";
import ImageResizer from "./components/image-resizer";
import ImageStats from "./components/image-stats";
import ImageZoomView from "./components/image-zoom-view";
import { ImageEditorProps } from "@/types/types";

// Define the editor states with clearer names
type EditorState =
  | "resizeAndOptimize" // Simple resize & optimize state (default view)
  | "editImage" // Main editing state with tools menu
  | "crop" // Cropping mode
  | "blur" // Blur tool mode
  | "paint" // Paint tool mode
  | "text"; // Text tool mode (to be implemented)

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
}: ImageEditorProps) {
  // Editor state
  const [editorState, setEditorState] =
    useState<EditorState>("resizeAndOptimize");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);

  // Tool states
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [format, setFormat] = useState<string>("jpeg");

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

  // State transition handlers
  const enterEditMode = useCallback(() => {
    setEditorState("editImage");
  }, []);

  const exitEditMode = useCallback(() => {
    setEditorState("resizeAndOptimize");
  }, []);

  const handleToggleState = useCallback((state: EditorState) => {
    setEditorState((prev) => (prev === state ? "editImage" : state));
  }, []);

  // Toggle eraser for paint tool
  const toggleEraser = useCallback(() => {
    setIsEraser((prev) => !prev);
  }, []);

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
      // In an actual implementation, this would apply the actual resize
      // For now, we'll simulate it with updated stats

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

      // Notify parent if needed
      if (onImageChange) {
        // In a real implementation, we would create a new image URL here
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

  // Apply crop
  const handleApplyCrop = useCallback(
    (croppedImageUrl: string) => {
      if (!croppedImageUrl) return;

      // Get image dimensions and update stats
      const img = new Image();
      img.src = croppedImageUrl;

      img.onload = async () => {
        // Update stats
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

        // Notify parent component
        if (onImageChange) {
          onImageChange(croppedImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange]
  );

  // Apply blur
  const handleBlurApply = useCallback(
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
        setEditorState("editImage"); // Return to edit mode after applying blur

        // Notify parent component
        if (onImageChange) {
          onImageChange(blurredImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange]
  );

  // Apply paint
  const handlePaintApply = useCallback(
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
        setEditorState("editImage"); // Return to edit mode after applying paint

        // Notify parent component
        if (onImageChange) {
          onImageChange(paintedImageUrl);
        }
      };
    },
    [originalStats, format, onImageChange]
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

    if (onReset) {
      onReset();
    }
  }, [originalStats, onReset]);

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

  // Cancel tool operation and return to edit mode
  const cancelTool = useCallback(() => {
    setEditorState("editImage");
  }, []);

  // Helper to determine if we're in edit mode or any tool mode
  const isInEditingState = editorState !== "default";

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Toolbar with appropriate controls based on state */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        {/* Left section of toolbar */}
        <div className="flex items-center gap-2">
          {/* Zoom controls always visible */}
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

          {/* Edit Mode Toggle Button - only in resize or edit mode */}
          {(editorState === "resizeAndOptimize" ||
            editorState === "editImage") &&
            (editorState === "resizeAndOptimize" ? (
              <Button
                onClick={enterEditMode}
                variant="default"
                className="h-10"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Image Mode
              </Button>
            ) : (
              <Button onClick={exitEditMode} variant="default" className="h-10">
                <Pencil className="mr-2 h-4 w-4" />
                Exit Edit Mode
              </Button>
            ))}

          {/* Show editing tools only in edit state */}
          {editorState === "editImage" && (
            <>
              <Button
                onClick={() => handleToggleState("crop")}
                variant="outline"
                className="h-10"
              >
                <Crop className="mr-2 h-4 w-4" />
                Crop
              </Button>
              <Button
                onClick={() => handleToggleState("blur")}
                variant="outline"
                className="h-10"
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur
              </Button>
              <Button
                onClick={() => handleToggleState("paint")}
                variant="outline"
                className="h-10"
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint
              </Button>
              <Button
                onClick={() => handleToggleState("text")}
                variant="outline"
                className="h-10"
              >
                <Type className="mr-2 h-4 w-4" />
                Text
              </Button>
            </>
          )}

          {/* Tool-specific controls for crop */}
          {editorState === "crop" && (
            <>
              <Button
                onClick={() => {
                  if (cropToolRef.current) {
                    cropToolRef.current.applyCrop();
                  }
                }}
                variant="default"
                className="h-10"
              >
                Apply Crop
              </Button>
              <Button onClick={cancelTool} variant="outline" className="h-10">
                Cancel
              </Button>
            </>
          )}

          {/* Tool-specific controls for blur */}
          {editorState === "blur" && (
            <>
              <Button
                onClick={() => {
                  if (blurCanvasRef.current) {
                    const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
                    if (dataUrl) handleBlurApply(dataUrl);
                  }
                }}
                variant="default"
                className="h-10"
              >
                Apply Blur
              </Button>
              <Button onClick={cancelTool} variant="outline" className="h-10">
                Cancel
              </Button>
            </>
          )}

          {/* Tool-specific controls for paint */}
          {editorState === "paint" && (
            <>
              <Button
                onClick={() => {
                  if (paintToolRef.current) {
                    const dataUrl = paintToolRef.current.getCanvasDataUrl();
                    if (dataUrl) handlePaintApply(dataUrl);
                  }
                }}
                variant="default"
                className="h-10"
              >
                Apply Paint
              </Button>
              <Button onClick={cancelTool} variant="outline" className="h-10">
                Cancel
              </Button>
            </>
          )}

          {/* Tool-specific controls for text */}
          {editorState === "text" && (
            <>
              <Button variant="default" className="h-10">
                Apply Text
              </Button>
              <Button onClick={cancelTool} variant="outline" className="h-10">
                Cancel
              </Button>
            </>
          )}

          {/* Pagination controls - only shown in resizeAndOptimize mode */}
          {editorState === "resizeAndOptimize" && onNavigateImage && (
            <div className="flex items-center gap-1 ml-4">
              <Button
                onClick={() => onNavigateImage("first")}
                variant="outline"
                className="h-9 px-3"
                disabled={currentPage <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onNavigateImage("prev")}
                variant="outline"
                className="h-9 px-3"
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 text-white">
                {currentPage} / {totalPages}
              </span>
              <Button
                onClick={() => onNavigateImage("next")}
                variant="outline"
                className="h-9 px-3"
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onNavigateImage("last")}
                variant="outline"
                className="h-9 px-3"
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right section: Action buttons - only shown in resizeAndOptimize mode */}
        {editorState === "resizeAndOptimize" && (
          <div className="flex items-center gap-2">
            {/* Reset button */}
            <Button onClick={handleReset} variant="outline" className="h-10">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            {/* Download button */}
            <Button onClick={handleDownload} variant="outline" className="h-10">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {/* Back to gallery */}
            {onClose && (
              <Button onClick={onClose} variant="outline" className="h-10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Upload
              </Button>
            )}

            {/* Remove all */}
            {onRemoveAll && (
              <Button
                onClick={onRemoveAll}
                variant="destructive"
                className="h-10"
              >
                Remove All Images
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tool-specific secondary toolbar */}
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
            <Button
              onClick={toggleEraser}
              variant={isEraser ? "default" : "outline"}
              className="h-9 ml-2"
            >
              <Eraser className="mr-2 h-4 w-4" />
              {isEraser ? "Using Eraser" : "Use Eraser"}
            </Button>
          </div>
        </div>
      )}

      {editorState === "text" && (
        <div className="flex items-center gap-4 p-2 bg-gray-700 rounded-lg mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-1 text-white">
              Font:
            </label>
            <select className="w-full bg-gray-600 text-white p-2 rounded">
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Courier New</option>
              <option>Georgia</option>
              <option>Verdana</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-white mr-2">
              Text Color:
            </label>
            <div className="flex gap-1">
              {[
                "#ff0000",
                "#00ff00",
                "#0000ff",
                "#ffff00",
                "#ffffff",
                "#000000",
              ].map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border border-gray-600"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input
              type="color"
              defaultValue="#ffffff"
              className="h-8 w-8 ml-2 rounded cursor-pointer"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter text..."
              className="w-full bg-gray-600 text-white p-2 rounded"
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
                    onApply={handleApplyCrop}
                    onCancel={cancelTool}
                  />
                ) : editorState === "blur" ? (
                  <BlurBrushCanvas
                    ref={blurCanvasRef}
                    imageUrl={imageUrl}
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    zoom={zoom}
                    onApply={handleBlurApply}
                    onCancel={cancelTool}
                    onBlurAmountChange={setBlurAmount}
                    onBlurRadiusChange={setBlurRadius}
                  />
                ) : editorState === "paint" ? (
                  <PaintTool
                    ref={paintToolRef}
                    imageUrl={imageUrl}
                    onApplyPaint={handlePaintApply}
                    onCancel={cancelTool}
                    onToggleEraser={toggleEraser}
                    isEraser={isEraser}
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

          {/* Sidebar with controls */}
          <aside className="md:col-span-1 space-y-6">
            {/* Only show resizer in resizeAndOptimize mode */}
            {editorState === "resizeAndOptimize" && (
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
              />
            )}

            {hasEdited && <ImageZoomView imageUrl={imageUrl} />}
          </aside>
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
}
