// app/components/image-resizer.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Gauge, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  format: string;
  onFormatChange: (format: string) => void;
  onDownload: () => void;
}

export default function ImageResizer({
  width,
  height,
  maxWidth,
  maxHeight,
  onResize,
  onApplyResize,
  format,
  onFormatChange,
  onDownload,
}: ImageResizerProps) {
  // Local state to manage internal values
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(
    width > 0 && height > 0 ? width / height : 1
  );
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Update local state when props change
  useEffect(() => {
    if (width !== currentWidth) {
      setCurrentWidth(width);
    }
    if (height !== currentHeight) {
      setCurrentHeight(height);
    }
    if (width > 0 && height > 0) {
      setAspectRatio(width / height);
    }
  }, [width, height]);

  // Memoized handlers for better performance
  const handleWidthChange = useCallback(
    (value: number[]) => {
      if (!value.length || typeof value[0] !== "number") return;

      const newWidth = value[0];
      setCurrentWidth(newWidth);

      if (keepAspectRatio && aspectRatio > 0) {
        const newHeight = Math.round(newWidth / aspectRatio);
        setCurrentHeight(newHeight);
        onResize(newWidth, newHeight);
      } else {
        onResize(newWidth, currentHeight);
      }
    },
    [keepAspectRatio, aspectRatio, onResize, currentHeight]
  );

  // Handle height change
  const handleHeightChange = useCallback(
    (value: number[]) => {
      if (!value.length || typeof value[0] !== "number") return;

      const newHeight = value[0];
      setCurrentHeight(newHeight);

      if (keepAspectRatio && aspectRatio > 0) {
        const newWidth = Math.round(newHeight * aspectRatio);
        setCurrentWidth(newWidth);
        onResize(newWidth, newHeight);
      } else {
        onResize(currentWidth, newHeight);
      }
    },
    [keepAspectRatio, aspectRatio, onResize, currentWidth]
  );

  // Optimize for Core Web Vitals with animation
  const optimizeForCoreWebVitals = useCallback(() => {
    // Start animation
    setIsOptimizing(true);

    // Calculate optimal dimensions based on original aspect ratio
    // Aim for a file size that helps with LCP (Largest Contentful Paint)
    const MAX_RECOMMENDED_WIDTH = 1000;
    const MAX_RECOMMENDED_HEIGHT = 800;

    let optimalWidth = Math.min(currentWidth, MAX_RECOMMENDED_WIDTH);
    let optimalHeight =
      aspectRatio > 0 ? Math.round(optimalWidth / aspectRatio) : currentHeight;

    // If height exceeds recommended, adjust dimensions
    if (optimalHeight > MAX_RECOMMENDED_HEIGHT) {
      optimalHeight = MAX_RECOMMENDED_HEIGHT;
      optimalWidth =
        aspectRatio > 0
          ? Math.round(optimalHeight * aspectRatio)
          : currentWidth;
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
  }, [currentWidth, currentHeight, aspectRatio, onResize, onApplyResize]);

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
            className="[&>.slider-track]:bg-gray-400"
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
            className="[&>.slider-track]:bg-gray-400"
            onValueChange={handleHeightChange}
          />
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="keep-aspect-ratio"
            checked={keepAspectRatio}
            onCheckedChange={(checked) => {
              const isChecked = !!checked;
              setKeepAspectRatio(isChecked);
              if (isChecked && width > 0 && height > 0) {
                setAspectRatio(width / height);
              }
            }}
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

        {/* Modified layout: Apply Resize button and Format dropdown equally sized */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onApplyResize}>
            <Maximize2 className="h-4 w-4 mr-2" />
            Apply Resize
          </Button>

          <Select value={format} onValueChange={onFormatChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 h-10">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Download button on its own row at full width */}
        <Button onClick={onDownload} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
