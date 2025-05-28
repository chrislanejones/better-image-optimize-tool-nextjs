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
  Trash2,
  Eraser,
  Type,
  Images,
  Moon,
  Sun,
  User,
  Undo,
  Redo,
  RotateCw,
  RotateCcw,
  ArrowLeft,
  Pencil,
  Lock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import SimplePagination from "./pagination-controls";
import { EditorState, NavigationDirection } from "@/types/types";
import { useTheme } from "next-themes";
import { ImageEditorToolbarProps } from "@/types/types";

export const ImageEditorToolbar: React.FC<ImageEditorToolbarProps> = ({
  editorState,
  isCompressing,
  zoom,
  historyIndex,
  historyLength,
  currentPage,
  totalPages,
  padlockAnimation,
  multiCropData,
  blurAmount,
  blurRadius,
  allImages,
  onZoomIn,
  onZoomOut,
  onUndo,
  onRedo,
  onRotateLeft,
  onRotateRight,
  onReset,
  onClose,
  onRemoveAll,
  onUploadNew,
  onNavigateImage,
  onStateChange,
  onApplyCrop,
  onApplyBlur,
  onApplyPaint,
  onApplyText,
  onBlurAmountChange,
  onBlurRadiusChange,
  onMultiCropApply,
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Render padlock for edit modes
  const renderPadlock = () => {
    if (editorState === "editImage" || editorState === "multiImageEdit") {
      return (
        <div
          className={`w-full flex justify-center items-center mb-4 ${
            padlockAnimation ? "animate-pulse" : ""
          }`}
        >
          <div className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-gray-600 border border-gray-500">
            {editorState === "multiImageEdit" ? (
              <>
                <Images
                  className={`h-4 w-4 ${
                    padlockAnimation ? "text-yellow-300" : "text-white"
                  }`}
                />
                <span className="font-medium">Multi Edit Mode</span>
              </>
            ) : (
              <>
                <Lock
                  className={`h-4 w-4 ${
                    padlockAnimation ? "text-yellow-300" : "text-white"
                  }`}
                />
                <span className="font-medium">Edit Image Mode</span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Render toolbar based on state
  const renderToolbar = () => {
    switch (editorState) {
      case "resizeAndOptimize":
        return (
          <>
            <div className="flex items-center gap-2">
              <Button
                onClick={onZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => onStateChange("editImage")}
                variant="outline"
                className="h-9"
                data-testid="edit-image-button"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit Image Mode
              </Button>
              <Button
                onClick={() => onStateChange("multiImageEdit")}
                variant="outline"
                className="h-9"
              >
                <Images className="mr-2 h-4 w-4" />
                Multi Edit
              </Button>
              {/* AI Editor Button with Animated Ring */}
              <div className="relative ">
                {/* Animated rainbow ring overlay */}
                <div className="absolute -inset-0.1 rounded-lg opacity-80 py-2 px-4 ">
                  <div className="w-full h-full rounded-lg bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 via-purple-500 to-red-500 animate-rainbow-slow"></div>
                </div>

                {/* Second rainbow ring for depth */}
                <div className="absolute -inset-0.1 rounded-lg">
                  <div className="w-full h-full rounded-lg bg-gradient-to-r from-purple-400 via-blue-400 via-green-400 via-yellow-400 via-orange-400 via-red-400 to-purple-400 animate-rainbow-reverse opacity-50"></div>
                </div>
                {/* Animated rainbow outline */}
                <div
                  className="absolute inset-0 rounded-md p-[1px] rainbow-border"
                  style={{
                    background:
                      "linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #6366f1, #a855f7, #ef4444)",
                    backgroundSize: "400% 100%",
                    animation: "rainbow-flow 4s ease-in-out infinite",
                  }}
                >
                  <div className="w-full h-full bg-background rounded-[calc(0.375rem-1px)]"></div>
                </div>

                {/* Main button (same styling as Multi Edit but disabled) */}
                <button
                  disabled
                  className="py-4 px-5 relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 h-9"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                      fill="currentColor"
                      opacity="0.5"
                    />
                    <path
                      d="M19 11L19.74 13.09L22 14L19.74 14.91L19 17L18.26 14.91L16 14L18.26 13.09L19 11Z"
                      fill="currentColor"
                      opacity="0.7"
                    />
                    <path
                      d="M5 11L5.74 13.09L8 14L5.74 14.91L5 17L4.26 14.91L2 14L4.26 13.09L5 11Z"
                      fill="currentColor"
                      opacity="0.3"
                    />
                  </svg>
                  AI Editor
                </button>
              </div>
              {onNavigateImage && (
                <SimplePagination
                  currentPage={currentPage || 1}
                  totalPages={totalPages || 1}
                  onNavigate={onNavigateImage}
                  className="ml-2"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={onReset} variant="outline" className="h-9">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              {onClose && (
                <Button onClick={onClose} variant="outline" className="h-9">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Upload
                </Button>
              )}
              {onRemoveAll && (
                <Button
                  onClick={onRemoveAll}
                  variant="destructive"
                  className="h-9"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove All Images
                </Button>
              )}
              {mounted && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                >
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                disabled
                className="h-9 w-9"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </>
        );

      case "editImage":
        return (
          <div className="w-full grid grid-cols-3 items-center">
            <div className="flex items-center gap-2 justify-self-start">
              <Button
                onClick={onZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Zoom Out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Zoom In"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onUndo}
                variant="outline"
                className="h-9 w-9 p-0"
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={onRedo}
                variant="outline"
                className="h-9 w-9 p-0"
                disabled={historyIndex >= historyLength - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button
                onClick={onRotateLeft}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Rotate Left"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={onRotateRight}
                variant="outline"
                className="h-9 w-9 p-0"
                title="Rotate Right"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 justify-self-center">
              <Button
                onClick={() => onStateChange("crop")}
                variant="outline"
                className="h-9"
              >
                <Crop className="mr-2 h-4 w-4" />
                Crop Image
              </Button>
              <Button
                onClick={() => onStateChange("blur")}
                variant="outline"
                className="h-9"
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>
              <Button
                onClick={() => onStateChange("paint")}
                variant="outline"
                className="h-9"
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>
              <Button
                onClick={() => onStateChange("text")}
                variant="outline"
                className="h-9"
              >
                <Type className="mr-2 h-4 w-4" />
                Text Tool
              </Button>
            </div>

            <div className="flex items-center gap-2 justify-self-end">
              <Button
                onClick={() => onStateChange("resizeAndOptimize")}
                variant="outline"
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" />
                Exit Edit Mode
              </Button>
            </div>
          </div>
        );

      case "multiImageEdit":
        return (
          <div className="w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                onClick={onMultiCropApply}
                variant="default"
                className="h-9"
                disabled={!multiCropData}
              >
                <Crop className="mr-2 h-4 w-4" />
                Multi Crop
              </Button>
              {multiCropData && (
                <span className="text-sm text-gray-400">
                  Crop area set - ready to apply
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onStateChange("resizeAndOptimize")}
                variant="outline"
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" />
                Exit Multi Edit Mode
              </Button>
            </div>
          </div>
        );

      case "crop":
      case "blur":
      case "paint":
      case "text":
        return (
          <>
            <div className="flex items-center gap-2">
              <Button
                onClick={onZoomOut}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={onZoomIn}
                variant="outline"
                className="h-9 w-9 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>

              {editorState === "crop" && (
                <>
                  <Button
                    onClick={onApplyCrop}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Crop
                  </Button>
                  <Button
                    onClick={() => onStateChange("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "blur" && (
                <>
                  <Button
                    onClick={onApplyBlur}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Blur
                  </Button>
                  <Button
                    onClick={() => onStateChange("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "paint" && (
                <>
                  <Button
                    onClick={onApplyPaint}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Paint
                  </Button>
                  <Button
                    onClick={() => onStateChange("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {editorState === "text" && (
                <>
                  <Button
                    onClick={onApplyText}
                    variant="default"
                    className="h-9"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Apply Text
                  </Button>
                  <Button
                    onClick={() => onStateChange("editImage")}
                    variant="outline"
                    className="h-9"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </>
        );
    }
  };

  return (
    <>
      {renderPadlock()}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        {renderToolbar()}
      </div>

      {/* Tool-specific secondary toolbars */}
      {editorState === "blur" && (
        <div className="flex items-center gap-4 p-2 bg-gray-700 rounded-lg mb-4">
          <div className="flex-1">
            <label
              htmlFor="blur-amount"
              className="text-sm font-medium block mb-1 text-white"
            >
              Blur Amount: {blurAmount}px
            </label>
            <Slider
              id="blur-amount"
              min={1}
              max={20}
              step={1}
              value={[blurAmount]}
              onValueChange={(values) => onBlurAmountChange(values[0])}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="blur-radius"
              className="text-sm font-medium block mb-1 text-white"
            >
              Brush Size: {blurRadius}px
            </label>
            <Slider
              id="blur-radius"
              min={5}
              max={50}
              step={1}
              value={[blurRadius]}
              onValueChange={(values) => onBlurRadiusChange(values[0])}
              className="w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};
