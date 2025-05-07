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
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint";

interface EditorToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onApply: () => void;
  onReset?: () => void;
  onUploadNew?: () => void;
  onRemoveAll?: () => void;
  isEraser?: boolean;
  onToggleEraser?: () => void;
  showUtilityButtons?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function EditorToolbar({
  mode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onApply,
  onReset,
  onUploadNew,
  onRemoveAll,
  isEraser = false,
  onToggleEraser,
  showUtilityButtons = true,
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {},
}: EditorToolbarProps) {
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

        {/* Tool buttons (only in edit mode) */}
        {mode === "edit" && (
          <>
            <Button onClick={() => onModeChange("crop")} variant="outline">
              <Crop className="mr-2 h-4 w-4" />
              Crop Image
            </Button>

            <Button onClick={() => onModeChange("blur")} variant="outline">
              <Droplets className="mr-2 h-4 w-4" />
              Blur Tool
            </Button>

            <Button onClick={() => onModeChange("paint")} variant="outline">
              <Paintbrush className="mr-2 h-4 w-4" />
              Paint Tool
            </Button>
          </>
        )}

        {/* Apply buttons for tool modes */}
        {mode === "crop" && (
          <Button onClick={onApply} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Crop
          </Button>
        )}

        {mode === "blur" && (
          <Button onClick={onApply} variant="default">
            <Check className="mr-2 h-4 w-4" />
            Apply Blur
          </Button>
        )}

        {mode === "paint" && (
          <>
            <Button onClick={onApply} variant="default">
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
        {/* Pagination controls - only shown in view mode */}
        {mode === "view" && totalPages > 1 && (
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

        {/* Exit buttons for different modes */}
        {mode === "edit" && (
          <Button onClick={() => onModeChange("view")} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Edit Mode
          </Button>
        )}

        {mode === "crop" && (
          <Button onClick={() => onModeChange("edit")} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Crop Tool
          </Button>
        )}

        {mode === "blur" && (
          <Button onClick={() => onModeChange("edit")} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Blur Tool
          </Button>
        )}

        {mode === "paint" && (
          <Button onClick={() => onModeChange("edit")} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Paint Tool
          </Button>
        )}

        {/* Utility buttons (only in view mode) */}
        {mode === "view" && showUtilityButtons && (
          <>
            <Button onClick={() => onModeChange("edit")} variant="default">
              <Crop className="mr-2 h-4 w-4" />
              Edit Image
            </Button>

            {onReset && (
              <Button onClick={onReset} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}

            {onUploadNew && (
              <Button onClick={onUploadNew} variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </Button>
            )}

            {onRemoveAll && (
              <Button onClick={onRemoveAll} variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Remove All
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EditorToolbar;
