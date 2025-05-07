// app/components/editor-controls/BlurControls.tsx
"use client";

import { useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MinusIcon, PlusIcon } from "lucide-react";

interface BlurControlsProps {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (value: number) => void;
  onBlurRadiusChange: (value: number) => void;
  className?: string;
}

export function BlurControls({
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
  className,
}: BlurControlsProps) {
  // Memoized handlers to improve performance
  const decreaseBlurAmount = useCallback(() => {
    onBlurAmountChange(Math.max(blurAmount - 1, 1));
  }, [blurAmount, onBlurAmountChange]);

  const increaseBlurAmount = useCallback(() => {
    onBlurAmountChange(Math.min(blurAmount + 1, 20));
  }, [blurAmount, onBlurAmountChange]);

  const decreaseBlurRadius = useCallback(() => {
    onBlurRadiusChange(Math.max(blurRadius - 1, 1));
  }, [blurRadius, onBlurRadiusChange]);

  const increaseBlurRadius = useCallback(() => {
    onBlurRadiusChange(Math.min(blurRadius + 1, 50));
  }, [blurRadius, onBlurRadiusChange]);

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
                className="h-7 w-7 p-0 rounded-md"
                aria-label="Decrease blur amount"
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                onClick={increaseBlurAmount}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                aria-label="Increase blur amount"
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <Slider
            id="blur-amount"
            min={1}
            max={20}
            step={1}
            value={[blurAmount]}
            onValueChange={(value) => {
              if (Array.isArray(value) && typeof value[0] === "number") {
                onBlurAmountChange(value[0]);
              }
            }}
            className="[&_.slider-track]:bg-gray-500"
            aria-label="Blur amount"
          />
          <p className="text-xs text-gray-300">
            Controls the intensity of the blur effect
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label
              htmlFor="blur-radius"
              className="text-sm font-medium text-white"
            >
              Brush Size: {blurRadius}px
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={decreaseBlurRadius}
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                aria-label="Decrease brush size"
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Button
                onClick={increaseBlurRadius}
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
            id="blur-radius"
            min={1}
            max={50}
            step={1}
            value={[blurRadius]}
            onValueChange={(value) => {
              if (Array.isArray(value) && typeof value[0] === "number") {
                onBlurRadiusChange(value[0]);
              }
            }}
            className="[&_.slider-track]:bg-gray-500"
            aria-label="Brush size"
          />
          <p className="text-xs text-gray-300">
            Controls the size of the blur brush
          </p>
        </div>
      </div>
    </div>
  );
}

export default BlurControls;
