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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the props interface
export interface ImageControlsProps {
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isEraser: boolean;
  format: string;
  onFormatChange: (format: string) => void;
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleEraser: () => void;
  onApplyCrop: () => void;
  onApplyBlur: () => void;
  onApplyPaint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onBackToGallery: () => void;
  onExitEditMode: () => void;
  isStandalone: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Define the component with the props interface
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
        {/* Zoom controls (always visible) */}
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

        {!isEditMode && (
          <Button onClick={onToggleEditMode} variant="outline">
            <WandSparkles className="mr-2 h-4 w-4" />
            Edit Image
          </Button>
        )}

        {/* Tool buttons (only in edit mode) */}
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

        {/* Apply buttons for tool modes */}
        {isCropping && (
          <Button onClick={onApplyCrop} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        )}

        {isBlurring && (
          <Button onClick={onApplyBlur} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Blur
          </Button>
        )}

        {isPainting && (
          <>
            <Button onClick={onApplyPaint} variant="default">
              <Check className="mr-2 h-4 w-4" />
              Apply Paint
            </Button>

            <Button
              onClick={onToggleEraser}
              variant={isEraser ? "default" : "outline"}
            >
              <Eraser className="mr-2 h-4 w-4" />
              {isEraser ? "Brush" : "Eraser"}
            </Button>
          </>
        )}
      </div>

      {/* Right side toolbar */}
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
          <Button onClick={onCancelCrop} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}

        {isBlurring && (
          <Button onClick={onCancelBlur} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}

        {isPainting && (
          <Button onClick={onCancelPaint} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}

        {/* Edit mode toggle (only when not in a specific tool) */}
        {!isCropping && !isBlurring && !isPainting && isEditMode && (
          <Button onClick={onExitEditMode} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Edit Mode
          </Button>
        )}

        {/* Utility buttons (only in view mode) */}
        {!isEditMode && (
          <>
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Button onClick={onDownload} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
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
