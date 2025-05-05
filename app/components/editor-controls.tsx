"use client";

import { useCallback, useMemo } from "react";
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

interface BlurControlsProps {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (value: number) => void;
  onBlurRadiusChange: (value: number) => void;
  className?: string;
}

export function Control({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: ControlProps) {
  // Memoize handlers to prevent unnecessary re-renders
  const decrease = useCallback(() => {
    onChange(Math.max(value - step, min));
  }, [value, step, min, onChange]);

  const increase = useCallback(() => {
    onChange(Math.min(value + step, max));
  }, [value, step, max, onChange]);

  // Memoize the slider value array
  const sliderValue = useMemo(() => [value], [value]);

  // Memoize the slider change handler
  const handleSliderChange = useCallback(
    (newValue: number[]) => {
      onChange(newValue[0]);
    },
    [onChange]
  );

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
        value={sliderValue}
        onValueChange={handleSliderChange}
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

export function BlurControls({
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
  className,
}: BlurControlsProps) {
  const controls = useMemo(
    () => ({
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
    }),
    [blurAmount, blurRadius, onBlurAmountChange, onBlurRadiusChange]
  );

  return <EditorControls className={className} controls={controls} />;
}

interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (value: number) => void;
  onBrushColorChange: (color: string) => void;
  className?: string;
}

export function PaintControls({
  brushSize,
  brushColor,
  onBrushSizeChange,
  onBrushColorChange,
  className,
}: PaintControlsProps) {
  const PRESET_COLORS = [
    "#000000",
    "#FFFFFF",
    "#FF0000",
    "#00FF00",
    "#0000FF",
    "#FFFF00",
    "#FF00FF",
    "#00FFFF",
    "#FFA500",
    "#800080",
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
