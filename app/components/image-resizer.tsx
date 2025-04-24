"use client";

import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Gauge } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ImageResizerProps {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  onResize: (width: number, height: number) => void;
  onApplyResize: () => void;
}

export default function ImageResizer({
  width,
  height,
  maxWidth,
  maxHeight,
  onResize,
  onApplyResize,
}: ImageResizerProps) {
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(width / height);
  // State to track button animation
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setCurrentWidth(width);
    setCurrentHeight(height);
    setAspectRatio(width / height);
  }, [width, height]);

  // Handle width change
  const handleWidthChange = (value: number[]) => {
    const newWidth = value[0];
    setCurrentWidth(newWidth);

    if (keepAspectRatio) {
      const newHeight = Math.round(newWidth / aspectRatio);
      setCurrentHeight(newHeight);
      onResize(newWidth, newHeight);
    } else {
      onResize(newWidth, currentHeight);
    }
  };

  // Handle height change
  const handleHeightChange = (value: number[]) => {
    const newHeight = value[0];
    setCurrentHeight(newHeight);

    if (keepAspectRatio) {
      const newWidth = Math.round(newHeight * aspectRatio);
      setCurrentWidth(newWidth);
      onResize(newWidth, newHeight);
    } else {
      onResize(currentWidth, newHeight);
    }
  };

  // Optimize for Core Web Vitals with animation
  const optimizeForCoreWebVitals = () => {
    // Start animation
    setIsOptimizing(true);

    // Calculate optimal dimensions based on original aspect ratio
    // Aim for a file size that helps with LCP (Largest Contentful Paint)

    // General recommendation is to keep images under 1000px wide for most websites
    // unless they're hero/banner images, while maintaining the aspect ratio
    const MAX_RECOMMENDED_WIDTH = 1000;
    const MAX_RECOMMENDED_HEIGHT = 800;

    let optimalWidth = Math.min(currentWidth, MAX_RECOMMENDED_WIDTH);
    let optimalHeight = Math.round(optimalWidth / aspectRatio);

    // If height exceeds recommended, adjust dimensions
    if (optimalHeight > MAX_RECOMMENDED_HEIGHT) {
      optimalHeight = MAX_RECOMMENDED_HEIGHT;
      optimalWidth = Math.round(optimalHeight * aspectRatio);
    }

    // Apply optimal dimensions
    setCurrentWidth(optimalWidth);
    setCurrentHeight(optimalHeight);
    onResize(optimalWidth, optimalHeight);

    // Auto-apply resize after animation completes
    setTimeout(() => {
      onApplyResize();
      // End animation
      setIsOptimizing(false);
    }, 800); // Delay to allow animation to complete
  };

  return (
    <Card className="bg-gray-800 text-white border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Resize</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="width" className="text-sm font-medium">
              Width: {currentWidth}px
            </label>
          </div>
          <Slider
            id="width"
            min={10}
            max={maxWidth}
            step={1}
            value={[currentWidth]}
            className="[&>.slider-track]:bg-gray-500"
            onValueChange={handleWidthChange}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="height" className="text-sm font-medium">
              Height: {currentHeight}px
            </label>
          </div>
          <Slider
            id="height"
            min={10}
            max={maxHeight}
            step={1}
            value={[currentHeight]}
            className="[&>.slider-track]:bg-gray-500"
            onValueChange={handleHeightChange}
          />
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="keep-aspect-ratio"
            checked={keepAspectRatio}
            onCheckedChange={(checked) =>
              setKeepAspectRatio(checked as boolean)
            }
          />
          <label htmlFor="keep-aspect-ratio" className="text-sm font-medium">
            Keep aspect ratio
          </label>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={optimizeForCoreWebVitals}
                className={`w-full mb-2 transition-all duration-300 ${
                  isOptimizing ? "animate-pulse" : ""
                }`}
                disabled={isOptimizing}
                variant="destructive"
              >
                <div className="flex items-center mr-2">
                  <Gauge className={"h-4 w-4"} />
                </div>
                {isOptimizing
                  ? "Optimizing..."
                  : "Optimize for Core Web Vitals"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Resize image to optimal dimensions for better page performance
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button onClick={onApplyResize} className="w-full">
          <Maximize2 className="h-4 w-4 mr-2" />
          Apply Resize
        </Button>
      </CardContent>
    </Card>
  );
}
