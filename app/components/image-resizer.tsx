// app/components/image-resizer.tsx
"use client";

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
import { CoreWebVitalsScore, ImageResizerProps } from "@/types/types";
import {
  COMPRESSION_LEVELS,
  CORE_WEB_VITALS,
} from "@/app/constants/editorConstants";

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
  quality = 85,
  onQualityChange,
}: ImageResizerProps) {
  const [widthValue, setWidthValue] = useState(width);
  const [heightValue, setHeightValue] = useState(height);
  const [initialWidth, setInitialWidth] = useState(width);
  const [initialHeight, setInitialHeight] = useState(height);
  const [aspectRatio, setAspectRatio] = useState(true);
  const [compressionLevel, setCompressionLevel] = useState("medium");
  const [hasAnyChanges, setHasAnyChanges] = useState(false);
  const [hasChangedDimensions, setHasChangedDimensions] = useState(false);
  const [coreWebVitalsScore, setCoreWebVitalsScore] =
    useState<CoreWebVitalsScore>("good");

  useEffect(() => {
    setWidthValue(width);
    setHeightValue(height);
    if (width !== initialWidth || height !== initialHeight) {
      setInitialWidth(width);
      setInitialHeight(height);
      setHasChangedDimensions(false);
    }
  }, [width, height, initialWidth, initialHeight]);

  useEffect(() => {
    // initialize compressionLevel based on quality
    if (quality >= 90) setCompressionLevel("low");
    else if (quality >= 80) setCompressionLevel("medium");
    else if (quality >= 60) setCompressionLevel("high");
    else setCompressionLevel("extremeSmall");
    updateCoreWebVitalsScore(width, height);
  }, []);

  const updateDimensions = (newW: number, newH: number, fromSlider = false) => {
    if (newW <= 0 || newH <= 0) return;
    let w = newW,
      h = newH;
    if (aspectRatio) {
      const ratio = initialWidth / initialHeight;
      if (fromSlider) {
        if (newW !== widthValue) h = Math.round(newW / ratio);
        else w = Math.round(newH * ratio);
      } else {
        h = Math.round(newW / ratio);
      }
    }
    setWidthValue(w);
    setHeightValue(h);
    onResize(w, h);
    const dimsChanged = w !== initialWidth || h !== initialHeight;
    setHasChangedDimensions(dimsChanged);
    setHasAnyChanges(true);
    updateCoreWebVitalsScore(w, h);
  };

  const handleWidthChange = (vals: number[]) =>
    updateDimensions(vals[0], heightValue, true);
  const handleHeightChange = (vals: number[]) =>
    updateDimensions(widthValue, vals[0], true);

  const toggleAspectRatio = () => setAspectRatio((p) => !p);

  const handleFormatChange = (fmt: string) => {
    onFormatChange(fmt);
    updateCoreWebVitalsScore(widthValue, heightValue);
  };

  const handleCompressionLevelChange = (value: string) => {
    setCompressionLevel(value);
    const levelConfig = COMPRESSION_LEVELS.find((l) => l.value === value);
    if (levelConfig && onQualityChange) {
      onQualityChange(levelConfig.quality);
    }
    setHasAnyChanges(true);
    updateCoreWebVitalsScore(widthValue, heightValue);
  };

  const updateCoreWebVitalsScore = (w: number, h: number) => {
    const imageSize = w * h;
    const buf = CORE_WEB_VITALS.BUFFER;
    let score: CoreWebVitalsScore;
    if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD - buf) {
      score = "good";
    } else if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD + buf) {
      score = "almost-there";
    } else if (imageSize <= CORE_WEB_VITALS.LCP_THRESHOLD_POOR - buf) {
      score = "needs-improvement";
    } else {
      score = "poor";
    }
    setCoreWebVitalsScore(score);
  };

  const handleReset = () => {
    setWidthValue(initialWidth);
    setHeightValue(initialHeight);
    setAspectRatio(true);
    setCompressionLevel("medium");
    setHasAnyChanges(false);
    setHasChangedDimensions(false);
    if (onQualityChange) onQualityChange(85);
    onResize(initialWidth, initialHeight);
    updateCoreWebVitalsScore(initialWidth, initialHeight);
    if (onReset) onReset();
  };

  const minWidth = Math.max(10, Math.round(initialWidth * 0.1));
  const minHeight = Math.max(10, Math.round(initialHeight * 0.1));

  return (
    <Card className="bg-gray-800 text-white border-gray-700">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="flex items-center text-base">
          <Image className="h-4 w-4 mr-2" /> Resize & Optimize
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Width */}
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium">Width: {widthValue}px</label>
          <Slider
            min={minWidth}
            max={maxWidth}
            value={[widthValue]}
            onValueChange={handleWidthChange}
          />
        </div>
        {/* Height */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Height: {heightValue}px</label>
          <Slider
            min={minHeight}
            max={maxHeight}
            value={[heightValue]}
            onValueChange={handleHeightChange}
          />
        </div>
        {/* Aspect Ratio */}
        <div className="flex items-center">
          <label className="text-sm flex-1">Maintain aspect ratio</label>
          <button
            onClick={toggleAspectRatio}
            className={`w-10 h-6 rounded-full flex items-center ${
              aspectRatio
                ? "bg-blue-600 justify-end"
                : "bg-gray-600 justify-start"
            } p-1`}
          >
            <span className="w-4 h-4 rounded-full bg-white" />
          </button>
        </div>
        {/* Compression Level */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Compression Level</label>
          <Select
            value={compressionLevel}
            onValueChange={handleCompressionLevelChange}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {COMPRESSION_LEVELS.map((lvl) => (
                <SelectItem key={lvl.value} value={lvl.value}>
                  {lvl.label} ({lvl.quality}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Core Web Vitals */}
        <div className="mt-4 mb-2">
          <span className="text-xs text-gray-300 mb-1 block">
            Core Web Vitals:
          </span>
          <div className="relative w-full h-4 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-teal-400 via-yellow-400 to-red-500">
            {hasAnyChanges && (
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
            )}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
            <span>Good</span>
            <span>Almost There</span>
            <span>Needs Work</span>
            <span>Poor</span>
          </div>
        </div>
        {/* Format */}
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
        {/* Actions */}

        <Button
          onClick={onApplyResize}
          className="w-full h-10 flex items-center justify-center gap-2"
          disabled={isCompressing && !hasChangedDimensions}
        >
          <Maximize2 className="mr-2 h-4 w-4" />{" "}
          {isCompressing ? "Processing…" : "Convert"}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full h-10 flex items-center justify-center gap-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Reset
        </Button>

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
