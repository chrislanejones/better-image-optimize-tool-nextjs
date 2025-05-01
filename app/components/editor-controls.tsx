"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * Unified control component that can be used for both blur and paint controls
 */
export function Control({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: ControlProps) {
  const decrease = () => {
    onChange(Math.max(value - step, min));
  };

  const increase = () => {
    onChange(Math.min(value + step, max));
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label
          htmlFor={`control-${label}`}
          className="text-sm font-medium text-white"
        >
          {label}: {value}px
        </label>
        <div className="flex items-center gap-1">
          <Button
            onClick={decrease}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 rounded-md"
          >
            <span className="text-sm">-</span>
          </Button>
          <Button
            onClick={increase}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0 rounded-md"
          >
            <span className="text-sm">+</span>
          </Button>
        </div>
      </div>
      <Slider
        id={`control-${label}`}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(value) => onChange(value[0])}
        className="[&>.slider-track]:bg-gray-500"
      />
    </div>
  );
}

interface EditorControlsProps {
  controls: {
    [key: string]: {
      value: number;
      min: number;
      max: number;
      step?: number;
      label: string;
      onChange: (value: number) => void;
    };
  };
  className?: string;
}

/**
 * Generic editor controls component that can be used for both blur and paint controls
 */
export function EditorControls({ controls, className }: EditorControlsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg",
        className
      )}
    >
      <div className="grid grid-cols-2 gap-6 w-full">
        {Object.entries(controls).map(([key, control]) => (
          <Control
            key={key}
            label={control.label}
            value={control.value}
            min={control.min}
            max={control.max}
            step={control.step}
            onChange={control.onChange}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Specialized blur controls component
 */
export function BlurControls({
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
  className,
}: {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (value: number) => void;
  onBlurRadiusChange: (value: number) => void;
  className?: string;
}) {
  return (
    <EditorControls
      className={className}
      controls={{
        blurAmount: {
          value: blurAmount,
          min: 1,
          max: 20,
          label: "Blur Amount",
          onChange: onBlurAmountChange,
        },
        brushSize: {
          value: blurRadius,
          min: 1,
          max: 30,
          label: "Brush Size",
          onChange: onBlurRadiusChange,
        },
      }}
    />
  );
}

/**
 * Specialized paint controls component
 */
export function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
  className,
}: {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (value: number) => void;
  onBrushColorChange: (color: string) => void;
  className?: string;
}) {
  // Color palette
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

  return (
    <div
      className={cn(
        "flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg",
        className
      )}
    >
      <div className="grid grid-cols-2 gap-6 w-full">
        <Control
          label="Brush Size"
          value={brushSize}
          min={1}
          max={100}
          onChange={onBrushSizeChange}
        />
        <div className="space-y-1">
          <label className="text-sm font-medium text-white block mb-2">
            Color: <span style={{ color: brushColor }}>■</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={cn(
                  "w-6 h-6 rounded-full transition-all",
                  brushColor.toLowerCase() === color.toLowerCase()
                    ? "ring-2 ring-white scale-110"
                    : "hover:scale-105"
                )}
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
