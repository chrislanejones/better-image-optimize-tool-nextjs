// app/components/image-controls.tsx
"use client";

import React, { useState, useEffect } from "react";
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
  Download,
  Type,
  Images,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageControlsProps } from "@/types/editor";
import { useTheme } from "next-themes";

const ImageControls: React.FC<ImageControlsProps> = ({
  isEditMode,
  isCropping,
  isBlurring,
  isPainting,
  isTexting = false,
  isEraser,
  format,
  onFormatChange,
  onToggleEditMode,
  onToggleCropping,
  onToggleBlurring,
  onTogglePainting,
  onToggleTexting,
  onToggleEraser,
  onApplyCrop,
  onApplyBlur,
  onApplyPaint,
  onApplyText,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
  onUploadNew,
  onRemoveAll,
  onCancelBlur,
  onCancelCrop,
  onCancelPaint,
  onCancelText,
  onExitEditMode,
  isStandalone,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
  onToggleMultiEditMode = () => {},
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Handle edit mode button click - ensure this function explicitly calls the passed handler
  const handleEditModeToggle = () => {
    console.log("Edit button clicked - calling onToggleEditMode");
    if (onToggleEditMode) {
      onToggleEditMode();
    } else {
      console.error("onToggleEditMode is not defined");
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
      {/* Left side toolbar */}
      <div className="flex items-center gap-2">
        {/* Zoom controls - always visible */}
        <div className="flex items-center gap-1 mr-2">
          <Button onClick={onZoomOut} variant="outline" className="h-9">
            <Minus className="h-4 w-4" />
          </Button>
          <Button onClick={onZoomIn} variant="outline" className="h-9">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Edit Image button - only when not in edit mode and not in any tool mode */}
        {!isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting && (
            <Button
              onClick={handleEditModeToggle}
              variant="outline"
              className="h-9"
            >
              <WandSparkles className="mr-2 h-4 w-4" />
              Edit Image
            </Button>
          )}

        {/* Multi-image edit button - only when not in edit mode */}
        {!isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting && (
            <Button
              onClick={onToggleMultiEditMode}
              variant="outline"
              className="h-9"
            >
              <Images className="mr-2 h-4 w-4" />
              Multi Edit
            </Button>
          )}

        {/* Tool buttons - only in edit mode and not in any tool mode */}
        {isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting && (
            <>
              <Button
                onClick={onToggleCropping}
                variant="outline"
                className="h-9"
              >
                <Crop className="mr-2 h-4 w-4" />
                Crop Image
              </Button>

              <Button
                onClick={onToggleBlurring}
                variant="outline"
                className="h-9"
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>

              <Button
                onClick={onTogglePainting}
                variant="outline"
                className="h-9"
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>

              {/* Add Text Tool button */}
              {onToggleTexting && (
                <Button
                  onClick={onToggleTexting}
                  variant="outline"
                  className="h-9"
                >
                  <Type className="mr-2 h-4 w-4" />
                  Text Tool
                </Button>
              )}
            </>
          )}

        {/* Apply buttons for specific tools */}
        {isCropping && (
          <Button onClick={onApplyCrop} variant="default" className="h-9">
            <Check className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        )}
        {isBlurring && !isCropping && (
          <Button onClick={onApplyBlur} variant="default" className="h-9">
            <Check className="mr-2 h-4 w-4" />
            Apply Blur
          </Button>
        )}

        {isPainting && !isCropping && (
          <>
            <Button onClick={onApplyPaint} variant="default" className="h-9">
              <Check className="mr-2 h-4 w-4" />
              Apply Paint
            </Button>

            {onToggleEraser && (
              <Button
                onClick={onToggleEraser}
                variant={isEraser ? "default" : "outline"}
                className="h-9"
              >
                <Eraser className="mr-2 h-4 w-4" />
                {isEraser ? "Brush" : "Eraser"}
              </Button>
            )}
          </>
        )}

        {/* Text tool apply button */}
        {isTexting && onApplyText && (
          <Button onClick={onApplyText} variant="default" className="h-9">
            <Check className="mr-2 h-4 w-4" />
            Apply Text
          </Button>
        )}
      </div>

      {/* Right side toolbar */}
      <div className="flex items-center gap-2">
        {/* Pagination controls - only in view mode and not in any tool mode */}
        {!isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting &&
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
          <Button onClick={onCancelCrop} variant="outline" className="h-9">
            <X className="mr-2 h-4 w-4" />
            Cancel Crop
          </Button>
        )}

        {isBlurring && !isCropping && (
          <Button onClick={onCancelBlur} variant="outline" className="h-9">
            <X className="mr-2 h-4 w-4" />
            Cancel Blur
          </Button>
        )}

        {isPainting && !isCropping && (
          <Button onClick={onCancelPaint} variant="outline" className="h-9">
            <X className="mr-2 h-4 w-4" />
            Cancel Paint
          </Button>
        )}

        {/* Cancel text tool */}
        {isTexting && onCancelText && (
          <Button onClick={onCancelText} variant="outline" className="h-9">
            <X className="mr-2 h-4 w-4" />
            Cancel Text
          </Button>
        )}

        {/* Exit Edit Mode button - only when in edit mode but not in any tool mode */}
        {isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting && (
            <Button onClick={onExitEditMode} variant="outline" className="h-9">
              <X className="mr-2 h-4 w-4" />
              Exit Edit Mode
            </Button>
          )}

        {/* Utility buttons - only in view mode and not in any tool mode */}
        {!isEditMode &&
          !isCropping &&
          !isBlurring &&
          !isPainting &&
          !isTexting && (
            <>
              <Button onClick={onReset} variant="outline" className="h-9">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              {onDownload && (
                <Button onClick={onDownload} variant="outline" className="h-9">
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {!isStandalone && (
                <>
                  <Button
                    onClick={onUploadNew}
                    variant="outline"
                    className="h-9"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New
                  </Button>

                  <Button
                    onClick={onRemoveAll}
                    variant="destructive"
                    className="h-9"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove All
                  </Button>
                </>
              )}

              {/* Theme and user buttons - Only shown in main view, not in edit modes */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="h-9 w-9"
              >
                {mounted && theme === "dark" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-9 w-9"
              >
                <User className="h-4 w-4" />
              </Button>
            </>
          )}
      </div>
    </div>
  );
};

export default ImageControls;
