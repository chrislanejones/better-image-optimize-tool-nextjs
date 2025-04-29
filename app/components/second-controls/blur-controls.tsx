"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface BlurControlsProps {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (value: number) => void;
  onBlurRadiusChange: (value: number) => void;
}

export default function BlurControls({
  blurAmount,
  blurRadius,
  onBlurAmountChange,
  onBlurRadiusChange,
}: BlurControlsProps) {
  const decreaseBlurAmount = () => {
    onBlurAmountChange(Math.max(blurAmount - 1, 1));
  };

  const increaseBlurAmount = () => {
    onBlurAmountChange(Math.min(blurAmount + 1, 20));
  };

  const decreaseBlurRadius = () => {
    onBlurRadiusChange(Math.max(blurRadius - 1, 1));
  };

  const increaseBlurRadius = () => {
    onBlurRadiusChange(Math.min(blurRadius + 1, 30));
  };

  return (
    <div className="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
      <div className="grid grid-cols-2 gap-6 w-full">
        <div className="space-y-1">
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
            value={[blurAmount]}
            onValueChange={(value) => {
              if (Array.isArray(value) && typeof value[0] === "number") {
                onBlurRadiusChange(value[0]);
              }
            }}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label
              htmlFor="blur-radius"
              className="text-sm font-medium text-white"
            >
              Blur Radius: {blurRadius}px
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={decreaseBlurRadius}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">-</span>
              </Button>
              <Button
                onClick={increaseBlurRadius}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">+</span>
              </Button>
            </div>
          </div>
          <Slider
            id="blur-radius"
            min={1}
            max={30}
            step={1}
            value={[blurRadius]}
            onValueChange={(value) => onBlurRadiusChange(value[0])}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>
      </div>
    </div>
  );
}
