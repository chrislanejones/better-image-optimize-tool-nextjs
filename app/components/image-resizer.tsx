"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Download, Image as ImgIcon, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoreWebVitalsScore, ImageResizerProps } from "@/types/types";
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
  compressionLevel,
  onCompressionLevelChange,
}: ImageResizerProps) {
  const [widthValue, setWidthValue] = useState(width);
  const [heightValue, setHeightValue] = useState(height);
  const [initialWidth, setInitialWidth] = useState(width);
  const [initialHeight, setInitialHeight] = useState(height);
  const [aspectRatio, setAspectRatio] = useState(true);
  const [hasAnyChanges, setHasAnyChanges] = useState(false);
  const [hasChangedDimensions, setHasChangedDimensions] = useState(false);
  const [coreScore, setCoreScore] = useState<CoreWebVitalsScore>("good");

  // Keep local in sync with props
  useEffect(() => {
    setWidthValue(width);
    setHeightValue(height);
    if (width !== initialWidth || height !== initialHeight) {
      setInitialWidth(width);
      setInitialHeight(height);
      setHasChangedDimensions(false);
    }
  }, [width, height, initialWidth, initialHeight]);

  // Initialize compressionLevel dropdown
  useEffect(() => {
    if (quality >= 90) onCompressionLevelChange?.("low");
    else if (quality >= 80) onCompressionLevelChange?.("medium");
    else if (quality >= 60) onCompressionLevelChange?.("high");
    else onCompressionLevelChange?.("extremeSmall");
    updateCoreScore(width, height);
  }, []);

  function updateCoreScore(w: number, h: number) {
    const size = w * h,
      buf = CORE_WEB_VITALS.BUFFER;
    const score =
      size <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD - buf
        ? "good"
        : size <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD + buf
        ? "almost-there"
        : size <= CORE_WEB_VITALS.LCP_THRESHOLD_POOR - buf
        ? "needs-improvement"
        : "poor";
    setCoreScore(score);
  }

  function updateDimensions(newW: number, newH: number, fromSlider = false) {
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
    setHasChangedDimensions(w !== initialWidth || h !== initialHeight);
    setHasAnyChanges(true);
    updateCoreScore(w, h);
  }

  const handleWidthChange = (vals: number[]) =>
    updateDimensions(vals[0], heightValue, true);
  const handleHeightChange = (vals: number[]) =>
    updateDimensions(widthValue, vals[0], true);
  const toggleAspectRatio = () => setAspectRatio((p) => !p);

  const handleFormatSelect = (fmt: string) => {
    onFormatChange(fmt);
    updateCoreScore(widthValue, heightValue);
  };

  const handleLevelChange = (lvl: string) => {
    onCompressionLevelChange?.(lvl);
    const cfg = COMPRESSION_LEVELS.find((l) => l.value === lvl);
    if (cfg) onQualityChange?.(cfg.quality);
    setHasAnyChanges(true);
    updateCoreScore(widthValue, heightValue);
  };

  const handleReset = () => {
    setWidthValue(initialWidth);
    setHeightValue(initialHeight);
    setAspectRatio(true);
    setHasAnyChanges(false);
    setHasChangedDimensions(false);
    onQualityChange?.(85);
    onResize(initialWidth, initialHeight);
    updateCoreScore(initialWidth, initialHeight);
    onReset();
  };

  const minW = Math.max(10, Math.round(initialWidth * 0.1));
  const minH = Math.max(10, Math.round(initialHeight * 0.1));

  return (
    <Card className="rounded-lg border shadow-sm bg-gray-800 text-white border-gray-700">
      <CardHeader className="flex flex-col space-y-1.5 p-3 pb-0">
        <CardTitle className="flex items-center text-base font-semibold tracking-tight">
          <ImgIcon className="h-4 w-4 mr-2" />
          Resize & Optimize
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {/* Width */}
        <div className="space-y-2 mt-3">
          <label className="text-sm font-medium">Width: {widthValue}px</label>
          <Slider
            min={minW}
            max={maxWidth}
            value={[widthValue]}
            onValueChange={handleWidthChange}
            className="w-full"
          />
        </div>

        {/* Height */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Height: {heightValue}px</label>
          <Slider
            min={minH}
            max={maxHeight}
            value={[heightValue]}
            onValueChange={handleHeightChange}
            className="w-full"
          />
        </div>

        {/* Aspect */}
        <div className="flex items-center">
          <label className="text-sm flex-1">Maintain aspect ratio</label>
          <button
            onClick={toggleAspectRatio}
            className={`w-10 h-6 p-1 rounded-full flex items-center ${
              aspectRatio
                ? "bg-blue-600 justify-end"
                : "bg-gray-600 justify-start"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white" />
          </button>
        </div>

        {/* Compression Level */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Compression Level</label>
          <Select value={compressionLevel} onValueChange={handleLevelChange}>
            <SelectTrigger className="bg-gray-700 border-gray-600">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {COMPRESSION_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
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
                    coreScore === "good"
                      ? "3%"
                      : coreScore === "almost-there"
                      ? "31%"
                      : coreScore === "needs-improvement"
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
        <Select value={format} onValueChange={handleFormatSelect}>
          <SelectTrigger className="w-full bg-gray-700 border-gray-600 h-10">
            <SelectValue placeholder="JPEG" />
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
          className="inline-flex items-center justify-center gap-2 w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Maximize2 className="h-4 w-4 mr-2" /> Convert
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="inline-flex items-center justify-center gap-2 w-full h-10"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Reset
        </Button>

        {onDownload && (
          <Button
            onClick={onDownload}
            variant="outline"
            className="inline-flex items-center justify-center gap-2 w-full h-10"
          >
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
