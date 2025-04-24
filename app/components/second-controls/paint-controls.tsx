"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (value: number) => void;
  onBrushColorChange: (color: string) => void;
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

export default function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
}: PaintControlsProps) {
  const decreaseBrushSize = () => {
    onBrushSizeChange(Math.max(brushSize - 1, 1));
  };

  const increaseBrushSize = () => {
    onBrushSizeChange(Math.min(brushSize + 5, 100));
  };

  return (
    <div className="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="space-y-1">
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
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">-</span>
              </Button>
              <Button
                onClick={increaseBrushSize}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">+</span>
              </Button>
            </div>
          </div>
          <Slider
            id="brush-size"
            min={1}
            max={100}
            step={1}
            value={[brushSize]}
            onValueChange={(value) => onBrushSizeChange(value[0])}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white block mb-2">
            Color: <span style={{ color: brushColor }}>■</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
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
          </div>
        </div>
      </div>
    </div>
  );
}
