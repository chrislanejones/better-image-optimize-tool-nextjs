// image-controls.tsx
"use client";

import React from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  WandSparkles,
  FolderDown,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageControlsProps } from "@/types/props";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ImageControls: React.FC<ImageControlsProps> = ({
  isEditMode,
  isCropping,
  isBlurring,
  isPainting,
  isEraser,
  format,
  onFormatChange,
  onToggleEditMode,
  onToggleCropping,
  onToggleBlurring,
  onTogglePainting,
  onToggleEraser,
  onApplyCrop,
  onApplyBlur,
  onApplyPaint,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
  onUploadNew,
  onRemoveAll,
  onCancelBlur,
  onCancelCrop,
  onCancelPaint,
  onBackToGallery,
  onExitEditMode,
  isStandalone,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
      {/* Left side toolbar */}
      <div className="flex items-center gap-2">
        {/* Zoom controls - always visible */}
        <div className="flex items-center gap-1 mr-2">
          <Button
            onClick={onZoomOut}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            onClick={onZoomIn}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Edit Image button - only when not in edit mode and not in any tool mode */}
        {!isEditMode && !isCropping && !isBlurring && !isPainting && (
          <Button onClick={onToggleEditMode} variant="outline">
            <WandSparkles className="mr-2 h-4 w-4" />
            Edit Image
          </Button>
        )}

        {/* Tool buttons - only in edit mode and not in any tool mode */}
        {isEditMode && !isCropping && !isBlurring && !isPainting && (
          <>
            <Button onClick={onToggleCropping} variant="outline">
              <Crop className="mr-2 h-4 w-4" />
              Crop Image
            </Button>

            <Button onClick={onToggleBlurring} variant="outline">
              <Droplets className="mr-2 h-4 w-4" />
              Blur Tool
            </Button>

            <Button onClick={onTogglePainting} variant="outline">
              <Paintbrush className="mr-2 h-4 w-4" />
              Paint Tool
            </Button>
          </>
        )}

        {/* Apply buttons for specific tools */}
        {isCropping && (
          <Button onClick={onApplyCrop} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        )}
        {isBlurring && !isCropping && (
          <Button onClick={onApplyBlur} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Blur
          </Button>
        )}

        {isPainting && !isCropping && (
          <>
            <Button onClick={onApplyPaint} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Apply Paint
            </Button>

            {onToggleEraser && (
              <Button
                onClick={onToggleEraser}
                variant={isEraser ? "default" : "outline"}
              >
                <Eraser className="mr-2 h-4 w-4" />
                {isEraser ? "Brush" : "Eraser"}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Right side toolbar */}
      <div className="flex items-center gap-2">
        {/* Pagination controls - only in view mode and not in any tool mode */}
        {!isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          totalPages > 1 && (
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

        {/* Cancel buttons for tool modes */}
        {isCropping && (
          <Button onClick={onCancelCrop} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel Crop
          </Button>
        )}

        {isBlurring && !isCropping && (
          <Button onClick={onCancelBlur} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel Blur
          </Button>
        )}

        {isPainting && !isCropping && (
          <Button onClick={onCancelPaint} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel Paint
          </Button>
        )}

        {/* Exit Edit Mode button - only when in edit mode but not in any tool mode */}
        {isEditMode && !isCropping && !isBlurring && !isPainting && (
          <Button onClick={onExitEditMode} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Edit Mode
          </Button>
        )}

        {/* Utility buttons - only in view mode and not in any tool mode */}
        {!isEditMode && !isCropping && !isBlurring && !isPainting && (
          <>
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button onClick={onDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {!isStandalone && (
              <>
                <Button onClick={onUploadNew} variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New
                </Button>

                <Button onClick={onBackToGallery} variant="outline">
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
  );
};

export default ImageControls;
