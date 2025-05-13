// Updated Toolbar.tsx
import { useState } from "react";
import {
  X,
  Crop,
  Droplets,
  Paintbrush,
  Eraser,
  Download,
  RefreshCw,
  ArrowLeft,
  Trash2,
  Upload,
  Minus,
  Plus,
  Edit,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToolbarProps, NavigationDirection } from "@/types/types";

// Toolbar component
export default function Toolbar({
  // Mode flags
  isEditMode,
  isCropping,
  isBlurring,
  isPainting,
  isEraser,
  isCompressing = false, // Add isCompressing prop with default

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

  // Pagination props
  currentPage,
  totalPages,
  onPageChange,
  onNavigateImage,

  isStandalone = false,
  className = "",
}: ToolbarProps) {
  const [showFormatOptions, setShowFormatOptions] = useState(false);

  // Function to safely call navigation handler
  const handleNavigate = (direction: NavigationDirection) => {
    if (onNavigateImage) {
      onNavigateImage(direction);
    }
  };

  return (
    <div
      className={`bg-gray-800 text-white p-2 rounded-lg flex justify-between items-center flex-wrap gap-2 ${className}`}
    >
      {/* Main editing toolbar */}
      {!isCropping && !isBlurring && !isPainting ? (
        <>
          {/* Left side controls */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <Button
              onClick={onZoomOut}
              variant="outline"
              className="h-8 w-8 p-0"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              onClick={onZoomIn}
              variant="outline"
              className="h-8 w-8 p-0"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Toggle edit mode button */}
            {!isStandalone && (
              <Button
                onClick={onToggleEditMode}
                variant={isEditMode ? "default" : "outline"}
                className="h-8"
                title={isEditMode ? "Exit edit mode" : "Edit image"}
              >
                {isEditMode ? (
                  <>
                    <X className="mr-1 h-4 w-4" />
                    Exit Edit
                  </>
                ) : (
                  <>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </>
                )}
              </Button>
            )}

            {/* Only show tool buttons in edit mode */}
            {isEditMode && (
              <div className="flex gap-1">
                <Button
                  onClick={onToggleCropping}
                  variant={isCropping ? "default" : "outline"}
                  className="h-8"
                  title="Crop image"
                >
                  <Crop className="mr-1 h-4 w-4" />
                  Crop
                </Button>

                <Button
                  onClick={onToggleBlurring}
                  variant={isBlurring ? "default" : "outline"}
                  className="h-8"
                  title="Blur parts of image"
                >
                  <Droplets className="mr-1 h-4 w-4" />
                  Blur
                </Button>

                <Button
                  onClick={onTogglePainting}
                  variant={isPainting ? "default" : "outline"}
                  className="h-8"
                  title="Paint on image"
                >
                  <Paintbrush className="mr-1 h-4 w-4" />
                  Paint
                </Button>
              </div>
            )}
          </div>

          {/* Compression indicator */}
          {isCompressing && (
            <div className="text-xs bg-blue-600 px-2 py-1 rounded-full animate-pulse ml-2">
              Compressing...
            </div>
          )}

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Format selector */}
            <Select value={format} onValueChange={onFormatChange}>
              <SelectTrigger className="h-8 w-20 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>

            {/* Action buttons */}
            <Button
              onClick={onReset}
              variant="outline"
              className="h-8"
              title="Reset image"
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              Reset
            </Button>

            <Button
              onClick={onDownload}
              variant="outline"
              className="h-8"
              title="Download edited image"
            >
              <Download className="mr-1 h-4 w-4" />
              Download
            </Button>

            {onBackToGallery && (
              <Button
                onClick={onBackToGallery}
                variant="outline"
                className="h-8"
                title="Back to gallery"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Gallery
              </Button>
            )}

            {onUploadNew && (
              <Button
                onClick={onUploadNew}
                variant="outline"
                className="h-8"
                title="Upload new image"
              >
                <Upload className="mr-1 h-4 w-4" />
                Upload
              </Button>
            )}

            {/* Remove all button */}
            {onRemoveAll && (
              <Button
                onClick={onRemoveAll}
                variant="destructive"
                className="h-8"
                title="Remove all images"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove All
              </Button>
            )}
          </div>
        </>
      ) : (
        // Tool-specific toolbars
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            {/* Zoom controls even in tool modes */}
            <Button
              onClick={onZoomOut}
              variant="outline"
              className="h-8 w-8 p-0"
              title="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <Button
              onClick={onZoomIn}
              variant="outline"
              className="h-8 w-8 p-0"
              title="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Tool-specific caption */}
            <span className="ml-2 text-sm">
              {isCropping
                ? "Crop Image"
                : isBlurring
                ? "Blur Tool"
                : isPainting
                ? `Paint Tool ${isEraser ? "(Eraser Mode)" : ""}`
                : ""}
            </span>
          </div>

          {/* Tool-specific actions */}
          <div className="flex items-center gap-2">
            {isCropping && (
              <>
                <Button onClick={onApplyCrop} variant="default" className="h-8">
                  <Check className="mr-1 h-4 w-4" />
                  Apply Crop
                </Button>

                <Button
                  onClick={onCancelCrop}
                  variant="outline"
                  className="h-8"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}

            {isBlurring && (
              <>
                <Button
                  onClick={() => {
                    // Create a blank handler if onApplyBlur needs a URL
                    const fakeDataUrl = "";
                    onApplyBlur(fakeDataUrl);
                  }}
                  variant="default"
                  className="h-8"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Apply Blur
                </Button>

                <Button
                  onClick={onCancelBlur}
                  variant="outline"
                  className="h-8"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}

            {isPainting && (
              <>
                <Button
                  onClick={onToggleEraser}
                  variant={isEraser ? "default" : "outline"}
                  className="h-8"
                >
                  <Eraser className="mr-1 h-4 w-4" />
                  {isEraser ? "Brush" : "Eraser"}
                </Button>

                <Button
                  onClick={() => {
                    // Create a blank handler if onApplyPaint needs a URL
                    const fakeDataUrl = "";
                    onApplyPaint(fakeDataUrl);
                  }}
                  variant="default"
                  className="h-8"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Apply Paint
                </Button>

                <Button
                  onClick={onCancelPaint}
                  variant="outline"
                  className="h-8"
                >
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Tool control components
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
