// app/components/editor-controls/PaintControls.tsx
"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "lucide-react";

interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (value: number) => void;
  onBrushColorChange: (color: string) => void;
  className?: string;
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
  "#A52A2A", // Brown
  "#008080", // Teal
];

export function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
  className,
}: PaintControlsProps) {
  // Memoized handlers to improve performance
  const decreaseBrushSize = useCallback(() => {
    onBrushSizeChange(Math.max(brushSize - 1, 1));
  }, [brushSize, onBrushSizeChange]);

  const increaseBrushSize = useCallback(() => {
    onBrushSizeChange(Math.min(brushSize + 5, 100));
  }, [brushSize, onBrushSizeChange]);

  return (
    <div
      className={cn(
        "flex items-center gap-4 mb-4 bg-gray-700 p-4 rounded-lg",
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="brush-size"
              className="text-sm font-medium text-white"
            >
              Brush Size: {brushSize}px
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={decreaseBrushSize}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                aria-label="Decrease brush size"
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                onClick={increaseBrushSize}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                aria-label="Increase brush size"
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Slider
            id="brush-size"
            min={1}
            max={100}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => {
              if (Array.isArray(value) && typeof value[0] === "number") {
                onBrushSizeChange(value[0]);
              }
            }}
            className="[&_.slider-track]:bg-gray-500"
            aria-label="Brush size"
          />
          <p className="text-xs text-gray-300">
            Controls the size of the paint brush
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white block mb-2">
            Color: <span className="inline-block w-4 h-4 ml-1" style={{ backgroundColor: brushColor }}></span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-8 h-8 rounded-md transition-all border-2",
                  brushColor.toLowerCase() === color.toLowerCase()
                    ? "border-white scale-110"
                    : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: color }}
                onClick={() => onBrushColorChange(color)}
                aria-label={`Select ${color} color`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Select a color for painting
          </p>
        </div>
      </div>
    </div>
  );
}

export default PaintControls;
