// Enhanced ImageResizer with improved Core Web Vitals for JPEGs and PNGs

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Download, Image, InfoIcon, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NavigationDirection,
  CoreWebVitalsScore,
  ImageResizerProps,
} from "@/types/types";
import {
  COMPRESSION_LEVELS,
  CORE_WEB_VITALS,
} from "@/app/constants/editorConstants";
import { cn } from "@/lib/utils";

export default function ImageResizer({
  width,
  height,
  maxWidth,
  maxHeight,
  onResize,
  onApplyResize,
  format,
  onReset,
  onFormatChange,
  onDownload,
  isCompressing = false,
  currentPage,
  totalPages,
  onNavigateImage,
  quality = 85,
  onQualityChange,
}: ImageResizerProps) {
  const [widthValue, setWidthValue] = useState<number>(width);
  const [heightValue, setHeightValue] = useState<number>(height);
  const [initialWidth, setInitialWidth] = useState<number>(width);
  const [initialHeight, setInitialHeight] = useState<number>(height);
  const [aspectRatio, setAspectRatio] = useState<boolean>(true);
  const [compressionLevel, setCompressionLevel] = useState<string>("medium");
  const [hasChangedDimensions, setHasChangedDimensions] =
    useState<boolean>(false);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [coreWebVitalsScore, setCoreWebVitalsScore] =
    useState<CoreWebVitalsScore>("good");
  const [hasAnyChanges, setHasAnyChanges] = useState<boolean>(false); // Add this here

  // Update local dimensions when props change
  useEffect(() => {
    setWidthValue(width);
    setHeightValue(height);

    // Store initial dimensions for comparison
    if (width !== initialWidth || height !== initialHeight) {
      setInitialWidth(width);
      setInitialHeight(height);
      setHasChangedDimensions(false);
    }

    // Calculate aspect ratio on mount or when dimensions change significantly
    if (width > 0 && height > 0) {
      const ratio = width / height;
      // Update aspect ratio in state if needed
    }
  }, [width, height, initialWidth, initialHeight]);

  // Initial calculation on mount
  useEffect(() => {
    if (width > 0 && height > 0) {
      updateCoreWebVitalsScore(width, height);
    }

    // Set compression level based on initial quality
    if (quality >= 90) setCompressionLevel("low");
    else if (quality >= 80) setCompressionLevel("medium");
    else if (quality >= 60) setCompressionLevel("high");
    else setCompressionLevel("extreme");
  }, []);

  // Update compression progress for visual feedback
  useEffect(() => {
    if (isCompressing) {
      const interval = setInterval(() => {
        setCompressionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 100);

      return () => {
        clearInterval(interval);
        setCompressionProgress(0);
      };
    }
  }, [isCompressing]);

  // Dimension update functions
  const updateDimensions = (
    newWidth: number,
    newHeight: number,
    fromSlider = false
  ) => {
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0)
      return;

    let adjustedWidth = newWidth;
    let adjustedHeight = newHeight;

    if (aspectRatio) {
      const baseRatio = initialWidth / initialHeight;
      if (fromSlider) {
        // Determine which dimension is changing
        const changingWidth = newWidth !== widthValue;
        if (changingWidth) {
          adjustedHeight = Math.round(newWidth / baseRatio);
        } else {
          adjustedWidth = Math.round(newHeight * baseRatio);
        }
      } else {
        adjustedHeight = Math.round(newWidth / baseRatio);
      }
    }

    setWidthValue(adjustedWidth);
    setHeightValue(adjustedHeight);
    onResize(adjustedWidth, adjustedHeight);

    updateCoreWebVitalsScore(adjustedWidth, adjustedHeight);
    const dimensionsChanged =
      adjustedWidth !== initialWidth || adjustedHeight !== initialHeight;
    setHasChangedDimensions(dimensionsChanged);
  };

  // Handle width slider change
  const handleWidthChange = (values: number[]) => {
    const newWidth = values[0];
    updateDimensions(newWidth, heightValue, true);
  };

  // Handle height slider change
  const handleHeightChange = (values: number[]) => {
    const newHeight = values[0];
    updateDimensions(widthValue, newHeight, true);
  };

  // Handle compression level change
  const handleCompressionLevelChange = (value: string) => {
    setCompressionLevel(value);

    // Automatically adjust quality based on compression level using constants
    if (onQualityChange) {
      const levelConfig = COMPRESSION_LEVELS.find(
        (level) => level.value === value
      );
      if (levelConfig) {
        onQualityChange(levelConfig.quality);
      }
    }

    // Update Core Web Vitals score
    updateCoreWebVitalsScore(widthValue, heightValue);
  };

  // Toggle aspect ratio lock
  const toggleAspectRatio = () => {
    setAspectRatio(!aspectRatio);
  };

  // Handle format change
  const handleFormatChange = (newFormat: string) => {
    onFormatChange(newFormat);
    updateCoreWebVitalsScore(widthValue, heightValue);
  };

  // Function to calculate Core Web Vitals score - IMPROVED FOR JPEG & PNG
  // Function to calculate Core Web Vitals score - IMPROVED FOR JPEG & PNG
  // Function to calculate Core Web Vitals score - IMPROVED FOR JPEG & PNG
  const updateCoreWebVitalsScore = (width: number, height: number) => {
    const imageSize = width * height;
    let newScore: CoreWebVitalsScore;

    const buffer = CORE_WEB_VITALS.BUFFER;

    if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD - buffer) {
      newScore = "good";
    } else if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD + buffer) {
      newScore = "almost-there";
    } else if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_POOR - buffer) {
      newScore = "needs-improvement";
    } else {
      newScore = "poor";
    }

    // Format impact - Less harsh on JPEG and PNG
    if (format === "webp") {
      // WebP gets a boost
      if (newScore === "needs-improvement") {
        newScore = "good";
      }
    } else if (format === "jpeg") {
      // JPEG is now neutral - no boost or penalty
      // High compression JPEGs can still be efficient
      if (
        compressionLevel === "high" ||
        compressionLevel === "extreme" ||
        compressionLevel === "extremeBW"
      ) {
        if (newScore === "needs-improvement") {
          newScore = "good";
        }
      }
    } else if (format === "png") {
      // PNG gets a slight penalty only for larger images and low compression
      if (
        newScore === "good" &&
        compressionLevel === "low" &&
        imageSize > CORE_WEB_VITALS.LCP_THRESHOLD_GOOD * 0.8
      ) {
        newScore = "needs-improvement";
      }
    }

    // Quality impact - High quality (low compression) can reduce score
    const qualityValue = quality || 85;

    if (
      qualityValue > 90 &&
      newScore === "good" &&
      imageSize > CORE_WEB_VITALS.LCP_THRESHOLD_GOOD * 0.7
    ) {
      newScore = "needs-improvement";
    } else if (qualityValue < 70 && newScore === "needs-improvement") {
      // High compression improves score
      newScore = "good";
    }

    // Compression level can improve score
    if (
      (compressionLevel === "high" ||
        compressionLevel === "extreme" ||
        compressionLevel === "extremeBW") &&
      newScore === "needs-improvement"
    ) {
      // High compression improves performance
      if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_POOR * 0.7) {
        newScore = "good";
      }
    }

    setCoreWebVitalsScore(newScore);
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

  // Get the color and label for Core Web Vitals score
  const getScoreColor = () => {
    switch (coreWebVitalsScore) {
      case "good":
        return "text-green-400";
      case "needs-improvement":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getScoreLabel = () => {
    switch (coreWebVitalsScore) {
      case "good":
        return "Good";
      case "needs-improvement":
        return "Needs Work";
      case "poor":
        return "Poor";
      default:
        return "Unknown";
    }
  };

  const handleReset = () => {
    console.log("Reset button clicked"); // Debug log

    // Reset all local states first
    setWidthValue(initialWidth);
    setHeightValue(initialHeight);
    setAspectRatio(true);
    setCompressionLevel("medium");
    setHasChangedDimensions(false);

    // Reset quality
    if (onQualityChange) {
      onQualityChange(85);
    }

    // Call parent's onResize to sync dimensions
    onResize(initialWidth, initialHeight);

    // Update Core Web Vitals score
    updateCoreWebVitalsScore(initialWidth, initialHeight);

    // Call external reset logic last (optional)
    if (onReset) {
      console.log("Calling external onReset"); // Debug log
      onReset();
    }

    // Add a new state to track if any changes have been made
    const [hasAnyChanges, setHasAnyChanges] = useState<boolean>(false);

    // Update the updateDimensions function to track changes
    const updateDimensions = (
      newWidth: number,
      newHeight: number,
      fromSlider = false
    ) => {
      if (
        isNaN(newWidth) ||
        isNaN(newHeight) ||
        newWidth <= 0 ||
        newHeight <= 0
      )
        return;

      let adjustedWidth = newWidth;
      let adjustedHeight = newHeight;

      if (aspectRatio) {
        const baseRatio = initialWidth / initialHeight;
        if (fromSlider) {
          const changingWidth = newWidth !== widthValue;
          if (changingWidth) {
            adjustedHeight = Math.round(newWidth / baseRatio);
          } else {
            adjustedWidth = Math.round(newHeight * baseRatio);
          }
        } else {
          adjustedHeight = Math.round(newWidth / baseRatio);
        }
      }

      setWidthValue(adjustedWidth);
      setHeightValue(adjustedHeight);
      onResize(adjustedWidth, adjustedHeight);

      updateCoreWebVitalsScore(adjustedWidth, adjustedHeight);
      const dimensionsChanged =
        adjustedWidth !== initialWidth || adjustedHeight !== initialHeight;
      setHasChangedDimensions(dimensionsChanged);

      // Track if any changes have been made
      setHasAnyChanges(dimensionsChanged);
    };

    // Update handleCompressionLevelChange to track changes
    const handleCompressionLevelChange = (value: string) => {
      setCompressionLevel(value);

      // Automatically adjust quality based on compression level using constants
      if (onQualityChange) {
        const levelConfig = COMPRESSION_LEVELS.find(
          (level) => level.value === value
        );
        if (levelConfig) {
          onQualityChange(levelConfig.quality);
        }
      }

      // Track that compression has changed
      setHasAnyChanges(true);

      // Update Core Web Vitals score
      updateCoreWebVitalsScore(widthValue, heightValue);
    };

    // Update handleReset to reset the changes tracking
    const handleReset = () => {
      // External reset logic (optional)
      if (onReset) {
        onReset();
      }

      // Reset all local states
      setWidthValue(initialWidth);
      setHeightValue(initialHeight);
      setAspectRatio(true);
      setCompressionLevel("medium");
      setHasChangedDimensions(false);
      setHasAnyChanges(false); // Reset changes tracking

      if (onQualityChange) {
        onQualityChange(85);
      }

      // Reset dimensions in parent component
      onResize(initialWidth, initialHeight);

      // Update Core Web Vitals score
      updateCoreWebVitalsScore(initialWidth, initialHeight);
    };

    console.log("Reset complete", { initialWidth, initialHeight }); // Debug log
  };

  return (
    <Card className="bg-gray-800 text-white border-gray-700">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center">
            <Image className="h-4 w-4 mr-2" />
            <span>Resize & Optimize</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Width slider */}
        <div className="space-y-2 mt-3">
          <div className="flex justify-between">
            <label htmlFor="width" className="text-sm font-medium">
              Width: {widthValue}px
            </label>
          </div>
          <Slider
            id="width"
            min={minWidth}
            max={maxWidth}
            step={1}
            value={[widthValue]}
            className="[&>.slider-track]:bg-gray-400"
            onValueChange={handleWidthChange}
          />
        </div>
        {/* Height slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="height" className="text-sm font-medium">
              Height: {heightValue}px
            </label>
          </div>
          <Slider
            id="height"
            min={minHeight}
            max={maxHeight}
            step={1}
            value={[heightValue]}
            className="[&>.slider-track]:bg-gray-400"
            onValueChange={handleHeightChange}
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
        {/* Compression Level */}
        <div className="flex flex-col space-y-2">
          <label htmlFor="compression-level" className="text-sm font-medium">
            Compression Level
          </label>
          <Select
            value={compressionLevel}
            onValueChange={handleCompressionLevelChange}
          >
            <SelectTrigger
              id="compression-level"
              className="bg-gray-700 border-gray-600"
            >
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {COMPRESSION_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label} [{level.quality}%]
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Core Web Vitals meter */}
        <div className="mt-4 mb-2">
          <span className="text-xs text-gray-300 mb-1 block">
            Core Web Vitals:
          </span>
          <div className="relative w-full h-4 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-teal-400 via-yellow-400 to-red-500">
            <div
              className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out"
              style={{
                left:
                  coreWebVitalsScore === "good"
                    ? "3%"
                    : coreWebVitalsScore === "almost-there"
                    ? "31%"
                    : coreWebVitalsScore === "needs-improvement"
                    ? "56%"
                    : "95%",
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow-md" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
            <span>Good</span>
            <span>Almost There</span>
            <span>Needs Work</span>
            <span>Poor</span>
          </div>
        </div>
        {/* Format name and info tooltip */}
        <div className="flex items-center text-xs text-gray-300 gap-2 mt-2">
          <span>
            Format: <span className="uppercase font-semibold">{format}</span>
          </span>
          <div className="relative group">
            <InfoIcon className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs text-xs text-white bg-gray-700 p-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {format === "webp" && (
                <span>
                  WebP: Modern format, great for web. 25–35% smaller than JPEG
                  with similar quality.
                </span>
              )}
              {format === "jpeg" && (
                <span>
                  JPEG: Best for photos. Universal support, great balance of
                  size and quality.
                </span>
              )}
              {format === "png" && (
                <span>
                  PNG: Great for transparency/text. Lossless, but larger file
                  sizes.
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Format selector, Reset, and Apply button */}

        <Select value={format} onValueChange={handleFormatChange}>
          <SelectTrigger className="w-full bg-gray-700 border-gray-600 h-10">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onApplyResize}
            disabled={isCompressing && !hasChangedDimensions}
            className="w-full h-10"
          >
            <Maximize2 className="mr-2 h-4 w-4" />
            {isCompressing ? "Processing..." : "Resize"}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full h-10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
        {/* Fixed Apply button - Only disable when compressing AND dimensions haven't changed */}

        {/* Download button */}
        {onDownload && (
          <Button
            onClick={onDownload}
            variant="outline"
            className="w-full h-10"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
