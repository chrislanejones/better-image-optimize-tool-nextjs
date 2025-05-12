"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  RefreshCw,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Minus,
  Plus,
  Crop,
  Droplets,
  Paintbrush,
  X,
  Download,
  Upload,
  Lock,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Toolbar props interface
interface ToolbarProps {
  // Mode flags
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isEraser: boolean;
  isCompressing?: boolean;

  // Format
  format: string;
  onFormatChange: (format: string) => void;

  // Mode toggles
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleEraser: () => void;

  // Action handlers
  onApplyCrop: () => void;
  onApplyBlur: (blurredImageUrl: string) => void;
  onApplyPaint: (paintedImageUrl: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  onUploadNew?: () => void;
  onRemoveAll?: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onBackToGallery?: () => void;
  onExitEditMode: () => void;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;

  isStandalone?: boolean;
  className?: string;
}

// Main Toolbar component
export default function Toolbar({
  // Mode flags
  isEditMode,
  isCropping,
  isBlurring,
  isPainting,
  isEraser,
  isCompressing = false,

  // Format
  format,
  onFormatChange,

  // Mode toggles
  onToggleEditMode,
  onToggleCropping,
  onToggleBlurring,
  onTogglePainting,
  onToggleEraser,

  // Action handlers
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

  // Pagination
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onNavigateImage,

  isStandalone = false,
  className = "",
}: ToolbarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative ${className}`}
    >
      {/* Left section with Edit button and editing tools */}
      <div className="flex items-center gap-2">
        {/* Edit Mode Button */}
        <Button
          onClick={onToggleEditMode}
          variant={isEditMode ? "default" : "outline"}
          className="h-10 px-4 py-2"
        >
          <Pencil className="mr-2 h-4 w-4" />
          {isEditMode ? "Exit Edit Mode" : "Edit Image"}
        </Button>

        {/* Show editing tools only in edit mode */}
        {isEditMode && (
          <>
            <Button
              onClick={onToggleCropping}
              variant={isCropping ? "default" : "outline"}
              className="h-10 px-4 py-2"
            >
              <Crop className="mr-2 h-4 w-4" />
              Crop
            </Button>

            <Button
              onClick={onToggleBlurring}
              variant={isBlurring ? "default" : "outline"}
              className="h-10 px-4 py-2"
            >
              <Droplets className="mr-2 h-4 w-4" />
              Blur
            </Button>

            <Button
              onClick={onTogglePainting}
              variant={isPainting ? "default" : "outline"}
              className="h-10 px-4 py-2"
            >
              <Paintbrush className="mr-2 h-4 w-4" />
              Paint
            </Button>
          </>
        )}
      </div>

      {/* Middle section: Zoom and active tool controls */}
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <Button onClick={onZoomOut} variant="outline" className="h-9 w-9 p-0">
          <Minus className="h-4 w-4" />
        </Button>

        <Button onClick={onZoomIn} variant="outline" className="h-9 w-9 p-0">
          <Plus className="h-4 w-4" />
        </Button>

        {/* Tool-specific controls */}
        {isCropping && (
          <>
            <Button onClick={onApplyCrop} variant="default" className="h-10">
              Apply Crop
            </Button>
            <Button onClick={onCancelCrop} variant="outline" className="h-10">
              Cancel
            </Button>
          </>
        )}

        {isBlurring && (
          <>
            <Button
              onClick={() => onApplyBlur("")}
              variant="default"
              className="h-10"
            >
              Apply Blur
            </Button>
            <Button onClick={onCancelBlur} variant="outline" className="h-10">
              Cancel
            </Button>
          </>
        )}

        {isPainting && (
          <>
            <Button
              onClick={() => onApplyPaint("")}
              variant="default"
              className="h-10"
            >
              Apply Paint
            </Button>
            <Button onClick={onCancelPaint} variant="outline" className="h-10">
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Right section: Action buttons */}
      <div className="flex items-center gap-2">
        {/* Format selector */}
        <Select value={format} onValueChange={onFormatChange}>
          <SelectTrigger className="w-24 h-10">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset button */}
        {onReset && (
          <Button onClick={onReset} variant="outline" className="h-10">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}

        {/* Download button */}
        {onDownload && (
          <Button onClick={onDownload} variant="outline" className="h-10">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}

        {/* Upload new */}
        {onUploadNew && (
          <Button onClick={onUploadNew} variant="outline" className="h-10">
            <Upload className="mr-2 h-4 w-4" />
            Upload New
          </Button>
        )}

        {/* Back to gallery */}
        {onBackToGallery && (
          <Button onClick={onBackToGallery} variant="outline" className="h-10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}

        {/* Remove all */}
        {onRemoveAll && (
          <Button onClick={onRemoveAll} variant="destructive" className="h-10">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove All
          </Button>
        )}
      </div>
    </div>
  );
}

// Blur controls component
export function BlurControls({
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
}: {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (amount: number) => void;
  onBlurRadiusChange: (radius: number) => void;
}) {
  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg mb-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="blur-amount" className="text-sm text-white">
            Blur Amount: {blurAmount}px
          </label>
        </div>
        <Slider
          id="blur-amount"
          min={1}
          max={20}
          step={1}
          value={[blurAmount]}
          onValueChange={(value) => onBlurAmountChange(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="blur-radius" className="text-sm text-white">
            Brush Size: {blurRadius}px
          </label>
        </div>
        <Slider
          id="blur-radius"
          min={5}
          max={50}
          step={1}
          value={[blurRadius]}
          onValueChange={(value) => onBlurRadiusChange(value[0])}
        />
      </div>
    </div>
  );
}

// Paint controls component
export function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
}: {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
}) {
  return (
    <div className="space-y-4 p-4 bg-gray-800 rounded-lg mb-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <label htmlFor="brush-size" className="text-sm text-white">
            Brush Size: {brushSize}px
          </label>
        </div>
        <Slider
          id="brush-size"
          min={1}
          max={50}
          step={1}
          value={[brushSize]}
          onValueChange={(value) => onBrushSizeChange(value[0])}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="brush-color" className="text-sm text-white block mb-2">
          Brush Color
        </label>
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-md border border-gray-600"
            style={{ backgroundColor: brushColor }}
          ></div>
          <input
            id="brush-color"
            type="color"
            value={brushColor}
            onChange={(e) => onBrushColorChange(e.target.value)}
            className="h-10 w-20"
          />
        </div>
      </div>
    </div>
  );
}
