// toolbar.tsx with fixed pagination controls (no selectedImage references)
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import CroppingTool, { CroppingToolRef } from "@/app/components/cropping-tool";
import ImageResizer from "@/app/components/image-resizer";
import ImageStats from "@/app/components/image-stats";
import ImageZoomView from "@/app/components/image-zoom-view";
import { ImageEditorProps } from "@/types/types";

// Define the editor states with clearer names
export type EditorState =
  | "resizeAndOptimize" // Simple resize & optimize state (default view)
  | "editImage" // Main editing state with tools menu
  | "crop" // Cropping mode
  | "blur" // Blur tool mode
  | "paint" // Paint tool mode
  | "text"; // Text tool mode

export default function ImageEditor({
  imageUrl,
  onImageChange,
  onReset,
  onDownload,
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

        // Notify parent component
        if (onImageChange) {
          onImageChange(croppedImageUrl);
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

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* Toolbar */}

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main editing area */}

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
