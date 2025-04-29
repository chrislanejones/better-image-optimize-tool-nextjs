"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface BlurControlsProps {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (value: number) => void;
  onBlurRadiusChange: (value: number) => void;
}

interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (value: number) => void;
  onBrushColorChange: (color: string) => void;
}

// Combined props type to handle both control types
interface EditorControlsProps {
  mode: "blur" | "paint";
  // Blur controls props
  blurAmount?: number;
  blurRadius?: number;
  onBlurAmountChange?: (value: number) => void;
  onBlurRadiusChange?: (value: number) => void;
  // Paint controls props
  brushSize?: number;
  brushColor?: string;
  onBrushSizeChange?: (value: number) => void;
  onBrushColorChange?: (color: string) => void;
}

const PRESET_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
];

export default function EditorControls({
  mode,
  // Blur props
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
  // Paint props
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
}: EditorControlsProps) {
  // Blur control handlers
  const decreaseBlurAmount = () => {
    if (onBlurAmountChange && blurAmount !== undefined) {
      onBlurAmountChange(Math.max(blurAmount - 1, 1));
    }
  };

  const increaseBlurAmount = () => {
    if (onBlurAmountChange && blurAmount !== undefined) {
      onBlurAmountChange(Math.min(blurAmount + 1, 20));
    }
  };

  const decreaseBlurRadius = () => {
    if (onBlurRadiusChange && blurRadius !== undefined) {
      onBlurRadiusChange(Math.max(blurRadius - 1, 1));
    }
  };

  const increaseBlurRadius = () => {
    if (onBlurRadiusChange && blurRadius !== undefined) {
      onBlurRadiusChange(Math.min(blurRadius + 1, 30));
    }
  };

  // Paint control handlers
  const decreaseBrushSize = () => {
    if (onBrushSizeChange && brushSize !== undefined) {
      onBrushSizeChange(Math.max(brushSize - 1, 1));
    }
  };

  const increaseBrushSize = () => {
    if (onBrushSizeChange && brushSize !== undefined) {
      onBrushSizeChange(Math.min(brushSize + 5, 100));
    }
  };

  return (
    <div className="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
      <div className="grid grid-cols-2 gap-6 w-full">
        {/* Left column - Size controls for either blur radius or brush size */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor={mode === "blur" ? "blur-radius" : "brush-size"}
              className="text-sm font-medium text-white"
            >
              {mode === "blur"
                ? `Brush Size: ${blurRadius}px`
                : `Brush Size: ${brushSize}px`}
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={
                  mode === "blur" ? decreaseBlurRadius : decreaseBrushSize
                }
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">-</span>
              </Button>
              <Button
                onClick={
                  mode === "blur" ? increaseBlurRadius : increaseBrushSize
                }
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">+</span>
              </Button>
            </div>
          </div>

          {mode === "blur" ? (
            <Slider
              id="blur-radius"
              min={1}
              max={30}
              step={1}
              value={blurRadius !== undefined ? [blurRadius] : [10]}
              onValueChange={(value) => {
                if (onBlurRadiusChange && Array.isArray(value)) {
                  onBlurRadiusChange(value[0]);
                }
              }}
              className="[&>.slider-track]:bg-gray-500"
            />
          ) : (
            <Slider
              id="brush-size"
              min={1}
              max={100}
              step={1}
              value={brushSize !== undefined ? [brushSize] : [10]}
              onValueChange={(value) => {
                if (onBrushSizeChange && Array.isArray(value)) {
                  onBrushSizeChange(value[0]);
                }
              }}
              className="[&>.slider-track]:bg-gray-500"
            />
          )}
        </div>

        {/* Right column - either blur amount or paint color */}
        <div className="space-y-1">
          {mode === "blur" ? (
            <>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="blur-amount"
                  className="text-sm font-medium text-white"
                >
                  Blur Amount: {blurAmount}px
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={decreaseBlurAmount}
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-md"
                  >
                    <span className="text-sm">-</span>
                  </Button>
                  <Button
                    onClick={increaseBlurAmount}
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-md"
                  >
                    <span className="text-sm">+</span>
                  </Button>
                </div>
              </div>
              <Slider
                id="blur-amount"
                min={1}
                max={20}
                step={1}
                value={blurAmount !== undefined ? [blurAmount] : [5]}
                onValueChange={(value) => {
                  if (onBlurAmountChange && Array.isArray(value)) {
                    onBlurAmountChange(value[0]);
                  }
                }}
                className="[&>.slider-track]:bg-gray-500"
              />
            </>
          ) : (
            <>
              <label className="text-sm font-medium text-white block mb-2">
                Color: <span style={{ color: brushColor }}>■</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full transition-all ${
                      brushColor &&
                      brushColor.toLowerCase() === color.toLowerCase()
                        ? "ring-2 ring-white scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      onBrushColorChange && onBrushColorChange(color)
                    }
                    aria-label={`Select ${color} color`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Export individual components for backward compatibility
export function BlurControls(props: BlurControlsProps) {
  return (
    <EditorControls
      mode="blur"
      blurAmount={props.blurAmount}
      blurRadius={props.blurRadius}
      onBlurAmountChange={props.onBlurAmountChange}
      onBlurRadiusChange={props.onBlurRadiusChange}
    />
  );
}

export function PaintControls(props: PaintControlsProps) {
  return (
    <EditorControls
      mode="paint"
      brushSize={props.brushSize}
      brushColor={props.brushColor}
      onBrushSizeChange={props.onBrushSizeChange}
      onBrushColorChange={props.onBrushColorChange}
    />
  );
}
