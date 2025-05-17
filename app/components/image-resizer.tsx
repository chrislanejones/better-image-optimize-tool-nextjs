// Enhanced ImageResizer with improved Core Web Vitals for JPEGs and PNGs

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Download, Image, InfoIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NavigationDirection } from "@/types/types";

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
  const [widthValue, setWidthValue] = useState<number>(width);
  const [heightValue, setHeightValue] = useState<number>(height);
  const [initialWidth, setInitialWidth] = useState<number>(width);
  const [initialHeight, setInitialHeight] = useState<number>(height);
  const [aspectRatio, setAspectRatio] = useState<boolean>(true);
  const [compressionLevel, setCompressionLevel] = useState<string>("medium"); // low, medium, high, extreme
  const [hasChangedDimensions, setHasChangedDimensions] =
    useState<boolean>(false);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [coreWebVitalsScore, setCoreWebVitalsScore] = useState<
    "poor" | "needs-improvement" | "good"
  >("good");

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
    // Validate input
    if (isNaN(newWidth) || isNaN(newHeight) || newWidth <= 0 || newHeight <= 0)
      return;

    if (aspectRatio) {
      if (fromSlider) {
        // For sliders, enforce aspect ratio based on which value was changed
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

    // Notify parent
    onResize(newWidth, newHeight);

    // Update Core Web Vitals score
    updateCoreWebVitalsScore(newWidth, newHeight);

    // Check if dimensions have changed from original
    const dimensionsChanged =
      newWidth !== initialWidth || newHeight !== initialHeight;
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

  // Handle quality change
  const handleQualityChange = (values: number[]) => {
    if (onQualityChange) {
      const newQuality = values[0];
      onQualityChange(newQuality);

      // Update compression level based on quality
      if (newQuality >= 90) setCompressionLevel("low");
      else if (newQuality >= 80) setCompressionLevel("medium");
      else if (newQuality >= 60) setCompressionLevel("high");
      else setCompressionLevel("extreme");

      updateCoreWebVitalsScore(widthValue, heightValue);
    }
  };

  // Handle compression level change
  const handleCompressionLevelChange = (value: string) => {
    setCompressionLevel(value);

    // Automatically adjust quality based on compression level
    if (onQualityChange) {
      switch (value) {
        case "low":
          onQualityChange(95);
          break;
        case "medium":
          onQualityChange(85);
          break;
        case "high":
          onQualityChange(75);
          break;
        case "extreme":
          onQualityChange(60);
          break;
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
  const updateCoreWebVitalsScore = (width: number, height: number) => {
    // More generous thresholds (less harsh on all formats)
    const LCP_THRESHOLD_GOOD = 1200 * 900; // ~1MP is now good for Largest Contentful Paint
    const LCP_THRESHOLD_POOR = 1800 * 1200; // ~2.2MP is now poor for LCP

    const imageSize = width * height;

    // Start with score based on dimensions
    let newScore: "poor" | "needs-improvement" | "good";

    if (imageSize <= LCP_THRESHOLD_GOOD) {
      newScore = "good";
    } else if (imageSize <= LCP_THRESHOLD_POOR) {
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
      if (compressionLevel === "high" || compressionLevel === "extreme") {
        if (newScore === "needs-improvement") {
          newScore = "good";
        }
      }
    } else if (format === "png") {
      // PNG gets a slight penalty only for larger images and low compression
      if (
        newScore === "good" &&
        compressionLevel === "low" &&
        imageSize > LCP_THRESHOLD_GOOD * 0.8
      ) {
        newScore = "needs-improvement";
      }
    }

    // Quality impact - High quality (low compression) can reduce score
    const qualityValue = quality || 85;

    if (
      qualityValue > 90 &&
      newScore === "good" &&
      imageSize > LCP_THRESHOLD_GOOD * 0.7
    ) {
      newScore = "needs-improvement";
    } else if (qualityValue < 70 && newScore === "needs-improvement") {
      // High compression improves score
      newScore = "good";
    }

    // Compression level can improve score
    if (
      (compressionLevel === "high" || compressionLevel === "extreme") &&
      newScore === "needs-improvement"
    ) {
      // High compression improves performance
      if (imageSize <= LCP_THRESHOLD_POOR * 0.7) {
        newScore = "good";
      }
    }

    setCoreWebVitalsScore(newScore);
  };

  // Calculate estimated file size - with improved format factors
  const calculateEstimatedSize = (): string => {
    if (!width || !height || !widthValue || !heightValue) return "Unknown";

    // Base size calculation based on dimensions
    const dimensionRatio = (widthValue * heightValue) / (width * height);

    // Adjusted format compression factors - more accurate for each format
    const formatFactor =
      format === "webp" ? 0.65 : format === "jpeg" ? 0.85 : 1.1;

    // Quality impact (quality level has exponential impact on file size)
    const qualityFactor = Math.pow((quality || 85) / 100, 1.5);

    // Adjust for compression level
    let compressionFactor = 1.0;
    if (compressionLevel === "extreme") compressionFactor = 0.7;
    else if (compressionLevel === "high") compressionFactor = 0.85;
    else if (compressionLevel === "medium") compressionFactor = 1.0;
    else if (compressionLevel === "low") compressionFactor = 1.2;

    // Estimate size in KB - starting from typical JPEG size
    let baseSize = Math.max((width * height) / 10, 20); // at least 20KB for small images
    const estimatedKB =
      baseSize *
      dimensionRatio *
      formatFactor *
      qualityFactor *
      compressionFactor;

    if (estimatedKB < 1024) {
      return `~${Math.round(estimatedKB)} KB`;
    } else {
      return `~${(estimatedKB / 1024).toFixed(2)} MB`;
    }
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

  return (
    <Card className="bg-gray-800 text-white border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-center">
          <div className="flex items-center">
            <Image className="h-4 w-4 mr-2" />
            <span>Resize & Optimize</span>
          </div>
          {isCompressing && (
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-300 bg-blue-600 px-2 py-1 rounded-full">
                {compressionProgress}%
              </span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Width slider */}
        <div className="space-y-2">
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

        {/* Quality slider - if onQualityChange is provided */}
        {onQualityChange && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <label htmlFor="quality" className="text-sm font-medium">
                Quality: {quality}%
              </label>
            </div>
            <Slider
              id="quality"
              min={30}
              max={100}
              step={5}
              value={[quality]}
              className="[&>.slider-track]:bg-gray-400"
              onValueChange={handleQualityChange}
            />
          </div>
        )}

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
              <SelectItem value="low">
                Low (Larger file, better quality)
              </SelectItem>
              <SelectItem value="medium">Medium (Balanced)</SelectItem>
              <SelectItem value="high">
                High (Smaller file, good quality)
              </SelectItem>
              <SelectItem value="extreme">Extreme (Smallest file)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Core Web Vitals visualization */}
        <div className="flex justify-between items-center mt-4 mb-2">
          <span className="text-xs text-gray-300">Core Web Vitals:</span>
          <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                coreWebVitalsScore === "good"
                  ? "bg-green-500"
                  : coreWebVitalsScore === "needs-improvement"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{
                width:
                  coreWebVitalsScore === "good"
                    ? "100%"
                    : coreWebVitalsScore === "needs-improvement"
                    ? "66%"
                    : "33%",
              }}
            />
          </div>
          <span
            className="text-xs font-semibold"
            style={{
              color:
                coreWebVitalsScore === "good"
                  ? "#10b981"
                  : coreWebVitalsScore === "needs-improvement"
                  ? "#f59e0b"
                  : "#ef4444",
            }}
          >
            {getScoreLabel()}
          </span>
        </div>

        {/* Size info */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-300">
          <span>
            Current: {widthValue}×{heightValue}
          </span>
          <span>Est. size: {calculateEstimatedSize()}</span>
        </div>

        {/* Format-specific information */}
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

        {format === "jpeg" && (
          <div className="bg-blue-900/20 p-2 rounded text-xs">
            <p className="font-medium mb-1">JPEG Format</p>
            <p>JPEG works well for photographs and realistic images.</p>
            <p className="mt-1">
              Good balance of quality and file size with universal support.
            </p>
          </div>
        )}

        {format === "png" && (
          <div className="bg-blue-900/20 p-2 rounded text-xs">
            <p className="font-medium mb-1">PNG Format</p>
            <p>PNG is best for images with transparency or text.</p>
            <p className="mt-1">
              Lossless format preserves details but creates larger files.
            </p>
          </div>
        )}

        {/* Format selector and Apply button */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={format} onValueChange={handleFormatChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600 h-10">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>

          {/* Fixed Apply button - Only disable when compressing AND dimensions haven't changed */}
          <Button
            onClick={onApplyResize}
            disabled={isCompressing && !hasChangedDimensions}
          >
            <Maximize2 className="h-4 w-4 mr-2" />
            {isCompressing ? "Processing..." : "Apply Resize"}
          </Button>
        </div>

        {/* Download button */}
        {onDownload && (
          <Button onClick={onDownload} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}

        {/* Pagination controls */}
        {onNavigateImage && currentPage && totalPages && totalPages > 1 && (
          <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-700">
            <span className="text-xs text-gray-400">
              Image {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNavigate("prev")}
                className="h-7 w-7 p-0"
                disabled={currentPage === 1}
              >
                ◀
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNavigate("next")}
                className="h-7 w-7 p-0"
                disabled={currentPage === totalPages}
              >
                ▶
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
