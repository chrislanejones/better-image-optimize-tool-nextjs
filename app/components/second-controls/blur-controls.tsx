"use client";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface BlurControlsProps {
  blurAmount: number;
  onBlurAmountChange: (value: number) => void;
}

export default function BlurControls({
  blurAmount,
  onBlurAmountChange,
}: BlurControlsProps) {
  const decreaseBlur = () => {
    onBlurAmountChange(Math.max(blurAmount - 1, 1));
  };

  const increaseBlur = () => {
    onBlurAmountChange(Math.min(blurAmount + 1, 20));
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
                onClick={decreaseBlur}
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 rounded-md"
              >
                <span className="text-sm">-</span>
              </Button>
              <Button
                onClick={increaseBlur}
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
            onValueChange={(value) => onBlurAmountChange(value[0])}
            className="[&>.slider-track]:bg-gray-500"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-white">
              Blur Radius: {Math.round(blurAmount * 1.5)}px
            </label>
          </div>
          <div className="bg-gray-800 p-3 rounded-md flex items-center justify-center h-10">
            <div className="w-full h-2 bg-gray-600 rounded-full relative">
              <div
                className="absolute h-full bg-blue-500 rounded-full"
                style={{ width: `${(blurAmount / 20) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
