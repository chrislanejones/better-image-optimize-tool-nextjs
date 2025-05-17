// Enhanced ImageResizer with real-time Core Web Vitals updates

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { NavigationDirection } from "@/types/types";
import { InfoIcon } from "lucide-react";

interface ImageResizerProps {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  onResize: (width: number, height: number) => void;
  onApplyResize: () => void;
  format: string;
  onFormatChange: (format: string) => void;
  onDownload?: () => void;
  isCompressing?: boolean;
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;
  quality?: number;
  onQualityChange?: (quality: number) => void;
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
  isCompressing = false,
  currentPage,
  totalPages,
  onNavigateImage,
  quality = 85,
  onQualityChange,
}: ImageResizerProps) {
  const [aspectRatio, setAspectRatio] = useState<boolean>(true);
  const [widthValue, setWidthValue] = useState<number>(width);
  const [heightValue, setHeightValue] = useState<number>(height);
  const [initialWidth, setInitialWidth] = useState<number>(width);
  const [initialHeight, setInitialHeight] = useState<number>(height);
  const [hasChangedDimensions, setHasChangedDimensions] =
    useState<boolean>(false);

  // Core Web Vitals estimation
  const [coreWebVitalsScore, setCoreWebVitalsScore] = useState<string>("Good");
  const [estimatedFileSize, setEstimatedFileSize] = useState<number>(0);
  const [savedPercentage, setSavedPercentage] = useState<number>(0);

  // Set initial dimensions on mount or when external width/height changes
  useEffect(() => {
    setWidthValue(width);
    setHeightValue(height);

    // Store initial dimensions for checking if values have changed
    if (width !== initialWidth || height !== initialHeight) {
      setInitialWidth(width);
      setInitialHeight(height);

      // Don't reset hasChangedDimensions when width/height are changed by the parent component
      // as a result of applying the resize. Only reset when a new image is loaded.
      if (
        Math.abs(width - initialWidth) > 10 ||
        Math.abs(height - initialHeight) > 10
      ) {
        setHasChangedDimensions(false);
      }
    }
  }, [width, height, initialWidth, initialHeight]);

  // Update Core Web Vitals on any parameter change
  useEffect(() => {
    updateCoreWebVitalsEstimate();
  }, [widthValue, heightValue, format, quality]);

  // Calculate Core Web Vitals score and file size estimate
  const updateCoreWebVitalsEstimate = () => {
    // Estimate original size (width * height * 3 bytes for RGB)
    const originalSize = initialWidth * initialHeight * 3;

    // Current dimensions size
    const currentSize = widthValue * heightValue * 3;

    // Apply format-specific compression ratio
    let compressionRatio = 1.0; // Base ratio (uncompressed)

    if (format === "webp") {
      compressionRatio = 0.65; // WebP is typically 65% of JPEG size
    } else if (format === "jpeg") {
      compressionRatio = 1.0; // Baseline for JPEG
    } else if (format === "png") {
      compressionRatio = 1.5; // PNG is typically larger than JPEG
    }

    // Apply quality adjustment to compression ratio
    const qualityFactor = quality / 85;
    compressionRatio *= qualityFactor;

    // Calculate final estimated size in KB
    const estimatedSize = (currentSize * compressionRatio) / 1024;
    setEstimatedFileSize(Math.round(estimatedSize));

    // Calculate savings percentage
    const originalSizeKB = originalSize / 1024;
    const savings = 100 - (estimatedSize / originalSizeKB) * 100;
    setSavedPercentage(Math.round(savings));

    // Determine Core Web Vitals score based on size and dimensions
    if (estimatedSize < 70) {
      setCoreWebVitalsScore("Excellent");
    } else if (estimatedSize < 150) {
      setCoreWebVitalsScore("Good");
    } else if (estimatedSize < 300) {
      setCoreWebVitalsScore("Needs Improvement");
    } else {
      setCoreWebVitalsScore("Poor");
    }
  };

  // Update dimensions with aspect ratio maintenance
  const updateDimensions = (
    newWidth: number,
    newHeight: number,
    fromSlider = false
  ) => {
    // Validate input
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0)
      return;

    if (aspectRatio) {
      if (fromSlider) {
        // For sliders, we enforce the aspect ratio based on which value was changed
        if (newWidth !== widthValue) {
          // Width was changed, calculate new height
          const ratio = initialHeight / initialWidth;
          newHeight = Math.round(newWidth * ratio);
        } else {
          // Height was changed, calculate new width
          const ratio = initialWidth / initialHeight;
          newWidth = Math.round(newHeight * ratio);
        }
      }
    }

    // Update state
    setWidthValue(newWidth);
    setHeightValue(newHeight);

    // Notify parent - this triggers the parent's update methods
    onResize(newWidth, newHeight);

    // Update our internal Core Web Vitals estimate as well
    // (This is separate from the parent's updateCoreWebVitalsScore)
    updateCoreWebVitalsEstimate();

    // Check if dimensions have changed from original
    const dimensionsChanged =
      newWidth !== initialWidth || newHeight !== initialHeight;
    setHasChangedDimensions(dimensionsChanged);
  };

  // Handle width slider change
  const handleWidthSliderChange = (values: number[]) => {
    const newWidth = values[0];
    updateDimensions(newWidth, heightValue, true);
  };

  // Handle height slider change
  const handleHeightSliderChange = (values: number[]) => {
    const newHeight = values[0];
    updateDimensions(widthValue, newHeight, true);
  };

  // Handle format change
  const handleFormatChange = (newFormat: string) => {
    onFormatChange(newFormat);
    // Core Web Vitals will update via the useEffect
  };

  // Handle quality change
  const handleQualityChange = (values: number[]) => {
    if (onQualityChange) {
      onQualityChange(values[0]);
      // Core Web Vitals will update via the useEffect
    }
  };

  // Toggle aspect ratio lock
  const toggleAspectRatio = () => {
    setAspectRatio(!aspectRatio);
  };

  // Handle navigation between images
  const handleNavigate = (direction: NavigationDirection) => {
    if (onNavigateImage) {
      onNavigateImage(direction);
    }
  };

  // Calculate slider minimums (don't allow below 10px)
  const minWidth = Math.max(10, Math.round(initialWidth * 0.1));
  const minHeight = Math.max(10, Math.round(initialHeight * 0.1));

  // Get the color for Core Web Vitals score
  const getScoreColor = () => {
    switch (coreWebVitalsScore) {
      case "Excellent":
        return "text-green-400";
      case "Good":
        return "text-blue-400";
      case "Needs Improvement":
        return "text-yellow-400";
      case "Poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="bg-gray-800 text-white border border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">Resize & Optimize</h3>

      <div className="space-y-4">
        {/* Width controls - clean design with just slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="width-slider" className="text-sm">
              Width
            </label>
            <span className="text-sm font-medium">{widthValue}px</span>
          </div>

          {/* Width slider */}
          <Slider
            id="width-slider"
            min={minWidth}
            max={maxWidth}
            step={1}
            value={[widthValue]}
            onValueChange={handleWidthSliderChange}
            className="w-full"
          />
        </div>

        {/* Height controls - clean design with just slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="height-slider" className="text-sm">
              Height
            </label>
            <span className="text-sm font-medium">{heightValue}px</span>
          </div>

          {/* Height slider */}
          <Slider
            id="height-slider"
            min={minHeight}
            max={maxHeight}
            step={1}
            value={[heightValue]}
            onValueChange={handleHeightSliderChange}
            className="w-full"
          />
        </div>

        {/* Aspect ratio toggle */}
        <div className="flex items-center">
          <label className="text-sm flex-1">Maintain aspect ratio</label>
          <button
            onClick={toggleAspectRatio}
            className={`w-10 h-6 rounded-full flex items-center ${
              aspectRatio
                ? "bg-blue-600 justify-end"
                : "bg-gray-600 justify-start"
            } p-1 transition-colors`}
          >
            <span className="w-4 h-4 rounded-full bg-white" />
          </button>
        </div>

        {/* Format selection */}
        <div className="space-y-1">
          <label htmlFor="format" className="text-sm">
            Format
          </label>
          <Select value={format} onValueChange={handleFormatChange}>
            <SelectTrigger id="format" className="h-9">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webp">WebP</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quality slider - if onQualityChange is provided */}
        {onQualityChange && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm">Quality</label>
              <span className="text-sm font-medium">{quality}%</span>
            </div>
            <Slider
              min={30}
              max={100}
              step={5}
              value={[quality]}
              onValueChange={handleQualityChange}
            />
            <p className="text-xs text-gray-400 mt-1">
              Lower quality = smaller file size.
              {quality < 60 ? " Compression artifacts may be visible." : ""}
            </p>
          </div>
        )}

        {/* Core Web Vitals Information - Live Updates */}
        <div className="bg-gray-900 p-3 rounded-md mt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center">
              <InfoIcon className="h-4 w-4 mr-1" />
              Google Core Web Vitals
            </h4>
            <span className={`text-sm font-medium ${getScoreColor()}`}>
              {coreWebVitalsScore}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Estimated Size:</span>
              <span className="font-medium">{estimatedFileSize} KB</span>
            </div>

            {savedPercentage > 0 && (
              <div className="flex justify-between">
                <span>Space Saved:</span>
                <span className="font-medium text-green-400">
                  {savedPercentage}%
                </span>
              </div>
            )}

            {format === "webp" && (
              <p className="pt-1 text-blue-300">
                WebP format provides optimal performance for web.
              </p>
            )}
          </div>
        </div>

        {/* Google WebP Information - If format is webp */}
        {format === "webp" && (
          <div className="bg-blue-900/20 p-2 rounded text-xs">
            <p className="font-medium mb-1">Google WebP Format</p>
            <p>
              WebP offers 25-35% smaller file sizes than JPEG with similar
              quality.
            </p>
            <p className="mt-1">
              Excellent for web use, supported by all modern browsers.
            </p>
          </div>
        )}

        {/* Pagination */}
        {onNavigateImage && currentPage && totalPages && totalPages > 1 && (
          <div className="py-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Image {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNavigate("prev")}
                className="h-7 w-7 p-0"
                disabled={
                  currentPage === 1 && totalPages > 1
                    ? false
                    : currentPage === 1
                }
              >
                ◀
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNavigate("next")}
                className="h-7 w-7 p-0"
                disabled={
                  currentPage === totalPages && totalPages > 1
                    ? false
                    : currentPage === totalPages
                }
              >
                ▶
              </Button>
            </div>
          </div>
        )}

        {/* Action buttons - FIX: Only disable Apply button when compressing AND dimensions haven't changed */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onApplyResize}
            className="w-full"
            disabled={isCompressing && !hasChangedDimensions}
          >
            {isCompressing ? "Processing..." : "Apply Resize"}
          </Button>

          {onDownload && (
            <Button onClick={onDownload} variant="outline" className="w-full">
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
