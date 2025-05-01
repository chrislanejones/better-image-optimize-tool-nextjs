// Modified ImageControls.tsx with pagination
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
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  onApplyBlur: () => void; // Remove the string parameter
  onApplyPaint: () => void; // Remove the string parameter
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
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
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
  // Pagination props with defaults
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
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
                {/* Change this line to use the blurCanvasRef */}
                <Button onClick={onApplyBlur} variant="default">
                  <Check className="mr-2 h-4 w-4" />
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
                {/* Change this line to use the paintToolRef */}
                <Button onClick={onApplyPaint} variant="default">
                  <Check className="mr-2 h-4 w-4" />
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

            {/* Pagination controls - only shown when not in edit mode */}
            {!isEditMode && totalPages > 1 && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="mx-2 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

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
