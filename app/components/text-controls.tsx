"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type TextControlsProps } from "@/types/editor";

const FONT_FAMILIES = [
  "Arial",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Comic Sans MS",
  "Tahoma",
  "Trebuchet MS",
  "Impact",
  "Helvetica",
];

const TEXT_COLORS = [
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

export default function TextControls({
  textSize,
  textFont,
  textColor,
  onTextSizeChange,
  onTextFontChange,
  onTextColorChange,
  className,
}: TextControlsProps) {
  // Helper to handle size changes
  const decreaseTextSize = () => {
    onTextSizeChange(Math.max(textSize - 1, 8));
  };

  const increaseTextSize = () => {
    onTextSizeChange(Math.min(textSize + 1, 72));
  };

  return (
    <div
      className={`flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg ${className}`}
    >
      <div className="grid grid-cols-3 gap-6 w-full">
        {/* Text Size Control */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="text-size"
              className="text-sm font-medium text-white"
            >
              Text Size: {textSize}px
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={decreaseTextSize}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">-</span>
              </Button>
              <Button
                onClick={increaseTextSize}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">+</span>
              </Button>
            </div>
          </div>
          <Slider
            id="text-size"
            min={8}
            max={72}
            step={1}
            value={[textSize]}
            onValueChange={(value) => onTextSizeChange(value[0])}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>

        {/* Font Family Control */}
        <div className="space-y-1">
          <label
            htmlFor="text-font"
            className="text-sm font-medium text-white block"
          >
            Font Family
          </label>
          <Select value={textFont} onValueChange={onTextFontChange}>
            <SelectTrigger id="text-font" className="h-8">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Color Picker */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-white block">
            Text Color
          </label>
          <div className="flex flex-wrap gap-2">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full transition-all ${
                  textColor.toLowerCase() === color.toLowerCase()
                    ? "ring-2 ring-white scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
                onClick={() => onTextColorChange(color)}
                aria-label={`Select ${color} color`}
              />
            ))}
            <input
              type="color"
              value={textColor}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer"
              aria-label="Custom color picker"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
