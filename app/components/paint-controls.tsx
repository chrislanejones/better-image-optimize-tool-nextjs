"use client";

import { Slider } from "@/components/ui/slider";

interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
  className?: string;
}

// Define common colors for the color picker
const COLORS = [
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

export function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
  className,
}: PaintControlsProps) {
  return (
    <div
      className={`flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg ${className}`}
    >
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="space-y-1">
          <label
            htmlFor="brush-size"
            className="text-sm font-medium text-white"
          >
            Brush Size: {brushSize}px
          </label>
          <Slider
            id="brush-size"
            min={1}
            max={50}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-white block">
            Brush Color
          </label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full transition-all ${
                  brushColor.toLowerCase() === color.toLowerCase()
                    ? "ring-2 ring-white scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onBrushColorChange(color)}
                aria-label={`Select ${color} color`}
              />
            ))}
            <input
              type="color"
              value={brushColor}
              onChange={(e) => onBrushColorChange(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer"
              aria-label="Custom color picker"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
