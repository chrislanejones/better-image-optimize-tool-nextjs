"use client";

import React, { useRef, useEffect, useCallback } from "react";
import "react-image-crop/dist/ReactCrop.css";
import { BlurControls, PaintControls } from "@/app/components/editor-controls";
import ImageStats from "./components/image-stats";
import CroppingTool from "./components/cropping-tool";
import ImageResizer from "./components/image-resizer";
import ImageZoomView from "./components/image-zoom-view";
import BlurBrushCanvas, { type BlurBrushCanvasRef } from "./components/BlurBrushCanvas";
import PaintTool, { type PaintToolRef } from "./components/paint-tool";
import { useImageStore, useImageActions } from "@/store/useImageStore";
import { useImageOperations } from "@/store/hooks/useImageOperations";
import { useImageControls } from "@/store/hooks/useImageControls";
import { useImageStats } from "@/store/hooks/useImageStats";
import { useImageHistoryWithStore } from "@store/hooks/useImageHistory";


const PLACEHOLDER_IMAGE = "/placeholder.svg";

interface ImageCropperProps {
  image: ImageFile;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

interface ImageFile {
  id: string;
  file: File;
  url: string;
  isNew?: boolean;
}

export default function ImageCropper({
  image,
  onUploadNew,
  onRemoveAll,
  onBackToGallery,
  isStandalone = false,
  onEditModeChange,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}: ImageCropperProps) {
  // Refs
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const blurCanvasRef = useRef<BlurBrushCanvasRef>(null);
  const paintToolRef = useRef<PaintToolRef>(null);

  // Zustand state
  const {
    width,
    height,
    format,
    previewUrl,
    isEditMode,
    isCropping,
    isBlurring,
    isPainting,
    blurAmount,
    blurRadius,
    brushSize,
    brushColor,
    isEraser,
    zoom,
    hasEdited,
    originalStats,
    newStats,
    dataSavings,
  } = useImageStore();

  // Zustand actions
  const actions = useImageActions();

  // Custom hooks
  const {
    toggleEditMode,
    toggleCropping,
    toggleBlurring,
    togglePainting,
    zoomIn,
    zoomOut,
    resetImage,
  } = useImageControls();

  const {
    handleCropComplete,
    handleResize,
    applyResize,
    handleBlurApply,
    handlePaintApply,
    downloadImage,
    initializeImage,
  } = useImageOperations();

  const { getFormattedStats } = useImageStats();
  const { saveState, performUndo, performRedo, canUndo, canRedo } = useImageHistoryWithStore();

  // Initialize with image data
  useEffect(() => {
    if (!image) return;

    // Initialize with a safe URL
    const safeUrl = image?.url && typeof image.url === "string" ? image.url : PLACEHOLDER_IMAGE;
    actions.setPreviewUrl(safeUrl);
    actions.selectImage(image);

    // Reset editing states
    actions.setIsCropping(false);
    actions.setIsBlurring(false);
    actions.setIsPainting(false);
    actions.setZoom(1);
    actions.setHasEdited(false);
    actions.setNewStats(null);

    // Get image dimensions when loaded
    if (imgRef.current) {
      initializeImage(imgRef.current);
    }

    // For standalone mode, always start in edit mode
    if (isStandalone) {
      actions.setIsEditMode(true);
    }

    // Cleanup function to revoke object URL
    return () => {
      if (previewUrl && previewUrl !== PLACEHOLDER_IMAGE && previewUrl !== image.url) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [image, isStandalone, actions, initializeImage, previewUrl]);

  // Update parent component when edit mode changes
  useEffect(() => {
    if (onEditModeChange) {
      onEditModeChange(isEditMode);
    }
  }, [isEditMode, onEditModeChange]);

  // Exit edit mode
  const exitEditMode = useCallback(() => {
    actions.setIsCropping(false);
    actions.setIsBlurring(false);
    actions.setIsPainting(false);
    if (!isStandalone) {
      actions.setIsEditMode(false);
    }
  }, [isStandalone, actions]);

  // Handle back to gallery 
  const handleBackToGallery = useCallback(() => {
    if (onBackToGallery) {
      onBackToGallery();
    } else {
      onUploadNew();
    }
  }, [onBackToGallery, onUploadNew]);

  // Get a safe image URL
  const getSafeImageUrl = useCallback((url: string | undefined): string => {
    if (!url || typeof url !== "string") return PLACEHOLDER_IMAGE;
    return url;
  }, []);

  // Only mount on client side
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button onClick={zoomOut} variant="outline">
              <Minus className="h-4 w-4" />
            </Button>
            <Button onClick={zoomIn} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {!isEditMode && (
            <Button onClick={toggleEditMode} variant="outline">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Image
            </Button>
          )}

          {isEditMode && !isCropping && !isBlurring && !isPainting && (
            <>
              <Button onClick={toggleCropping} variant="outline">
                <Crop className="mr-2 h-4 w-4" />
                Crop Image
              </Button>

              <Button onClick={toggleBlurring} variant="outline">
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>

              <Button onClick={togglePainting} variant="outline">
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>
            </>
          )}

          {isCropping && (
            <Button onClick={() => handleCropComplete?.(completedCrop, imgRef.current!)} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Apply Crop
            </Button>
          )}

          {isBlurring && (
            <Button onClick={() => {
              if (blurCanvasRef.current) {
                const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
                if (dataUrl) {
                  handleBlurApply(dataUrl);
                }
              }
            }} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Apply Blur
            </Button>
          )}

          {isPainting && (
            <>
              <Button onClick={() => {
                if (paintToolRef.current) {
                  const dataUrl = paintToolRef.current.getCanvasDataUrl();
                  if (dataUrl) {
                    handlePaintApply(dataUrl);
                  }
                }
              }} variant="default">
                <Check className="mr-2 h-4 w-4" />
                Apply Paint
              </Button>

              <Button
                onClick={() => actions.setIsEraser(!isEraser)}
                variant={isEraser ? "default" : "outline"}
              >
                <Eraser className="mr-2 h-4 w-4" />
                {isEraser ? "Brush" : "Eraser"}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination controls - only shown in view mode */}
          {!isEditMode && totalPages > 1 && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="h-9 w-9"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="mx-2 text-sm text-white">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-9 w-9"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Tool-specific cancel buttons */}
          {isCropping && (
            <Button onClick={() => actions.setIsCropping(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Exit Edit Mode
            </Button>
          )}

          {/* Utility buttons (only in view mode) */}
          {!isEditMode && (
            <>
              <Button onClick={resetImage} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <Button onClick={downloadImage} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              {!isStandalone && (
                <>
                  <Button onClick={onUploadNew} variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New
                  </Button>

                  <Button onClick={handleBackToGallery} variant="outline">
                    <FolderDown className="mr-2 h-4 w-4" />
                    Add From Files
                  </Button>

                  <Button onClick={onRemoveAll} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove All
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tool-specific controls */}
      {isBlurring && (
        <div className="mb-2">
          <BlurControls
            blurAmount={blurAmount}
            blurRadius={blurRadius}
            onBlurAmountChange={actions.setBlurAmount}
            onBlurRadiusChange={actions.setBlurRadius}
          />
        </div>
      )}

      {isPainting && (
        <div className="mb-2">
          <PaintControls
            brushSize={brushSize}
            brushColor={brushColor}
            onBrushSizeChange={actions.setBrushSize}
            onBrushColorChange={actions.setBrushColor}
          />
        </div>
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
                    onCancel={() => actions.setIsCropping(false)}
                  />
                ) : isBlurring ? (
                  <BlurBrushCanvas
                    ref={blurCanvasRef}
                    imageUrl={previewUrl}
                    blurAmount={blurAmount}
                    blurRadius={blurRadius}
                    onBlurAmountChange={actions.setBlurAmount}
                    onBlurRadiusChange={actions.setBlurRadius}
                    onApply={handleBlurApply}
                    onCancel={() => actions.setIsBlurring(false)}
                  />
                ) : isPainting ? (
                  <PaintTool
                    ref={paintToolRef}
                    imageUrl={previewUrl}
                    isEraser={isEraser}
                    onToggleEraser={() => actions.setIsEraser(!isEraser)}
                    onApplyPaint={handlePaintApply}
                    onCancel={() => actions.setIsPainting(false)}
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
                      src={getSafeImageUrl(previewUrl)}
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
                onFormatChange={actions.setFormat}
                onDownload={downloadImage}
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

              Cancel
            </Button>
          )}

          {isBlurring && (
            <Button onClick={() => actions.setIsBlurring(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}

          {isPainting && (
            <Button onClick={() => actions.setIsPainting(false)} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}

          {/* Edit mode toggle */}
          {!isCropping && !isBlurring && !isPainting && isEditMode && (
            <Button onClick={exitEditMode} variant="outline">
              <X className="mr-2 h-4 w-4" />