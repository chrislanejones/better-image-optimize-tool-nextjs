// Modified ImageControls.tsx
import { Button } from "@/components/ui/button";
import {
  Pencil,
  RefreshCw,
  Upload,
  Trash2,
  Crop,
  Check,
  X,
  Droplets,
  Paintbrush,
  ChevronLeft,
  Minus,
  Plus,
  Eraser,
} from "lucide-react";

interface ImageControlsProps {
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
  onApplyBlur: (url: string) => void;
  onApplyPaint: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onBackToGallery?: () => void;
  onExitEditMode: () => void;
  isStandalone?: boolean;
}

export default function ImageControls({
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
  isStandalone = false,
}: ImageControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
      {isEditMode ? (
        <>
          <div className="flex items-center gap-2">
            {!isCropping && !isBlurring && !isPainting && (
              <>
                <div className="flex items-center gap-1 mr-2">
                  <Button onClick={onZoomOut} variant="outline">
                    <span className="text-lg">-</span>
                  </Button>
                  <Button onClick={onZoomIn} variant="outline">
                    <span className="text-lg">+</span>
                  </Button>
                </div>
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
            {isCropping && (
              <>
                <div className="flex items-center gap-1 mr-2">
                  <Button onClick={onZoomOut} variant="outline">
                    <span className="text-lg">-</span>
                  </Button>
                  <Button onClick={onZoomIn} variant="outline">
                    <span className="text-lg">+</span>
                  </Button>
                </div>
                <Button onClick={onApplyCrop} variant="default">
                  <Check className="mr-2 h-4 w-4" />
                  Apply Crop
                </Button>
                <Button onClick={onCancelCrop} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </>
            )}
            {isBlurring && (
              <>
                <div className="flex items-center gap-1 mr-2">
                  <Button onClick={onZoomOut} variant="outline">
                    <span className="text-lg">-</span>
                  </Button>
                  <Button onClick={onZoomIn} variant="outline">
                    <span className="text-lg">+</span>
                  </Button>
                </div>
                <Button onClick={onToggleCropping} variant="outline">
                  <Crop className="mr-2 h-4 w-4" />
                  Crop Image
                </Button>
                <Button onClick={() => onApplyBlur("")} variant="default">
                  <Droplets className="mr-2 h-4 w-4" />
                  Apply Blur
                </Button>
                <Button onClick={onTogglePainting} variant="outline">
                  <Paintbrush className="mr-2 h-4 w-4" />
                  Paint Tool
                </Button>
              </>
            )}
            {isPainting && (
              <>
                <div className="flex items-center gap-1 mr-2">
                  <Button onClick={onZoomOut} variant="outline">
                    <span className="text-lg">-</span>
                  </Button>
                  <Button onClick={onZoomIn} variant="outline">
                    <span className="text-lg">+</span>
                  </Button>
                </div>
                <Button onClick={onToggleCropping} variant="outline">
                  <Crop className="mr-2 h-4 w-4" />
                  Crop Image
                </Button>
                <Button onClick={onToggleBlurring} variant="outline">
                  <Droplets className="mr-2 h-4 w-4" />
                  Blur Tool
                </Button>
                <Button onClick={() => onApplyPaint("")} variant="default">
                  <Paintbrush className="mr-2 h-4 w-4" />
                  Apply Paint
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isBlurring && (
              <Button onClick={onCancelBlur} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel Blur
              </Button>
            )}
            {isPainting && (
              <>
                <Button
                  onClick={onToggleEraser}
                  variant={isEraser ? "default" : "outline"}
                >
                  <Eraser className="mr-2 h-4 w-4" />
                  {isEraser ? "Brush" : "Eraser"}
                </Button>
                <Button onClick={onCancelPaint} variant="outline">
                  <X className="mr-2 h-4 w-4" />
                  Cancel Paint
                </Button>
              </>
            )}
            <Button onClick={onExitEditMode} variant="default">
              <X className="mr-2 h-4 w-4" />
              Exit Edit Mode
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Button onClick={onToggleEditMode}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Image Mode
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            {/* Removed Format dropdown and Download button */}

            <Button onClick={onUploadNew} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Images
            </Button>

            <Button onClick={onRemoveAll} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove All Images
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
