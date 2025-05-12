// Updated ImageResizer.tsx with removed pagination controls
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Maximize2, Gauge, Download, Image } from "lucide-react";
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
import { ImageResizerProps } from "@/types/types";

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
  // Other props
  isCompressing,
}: ImageResizerProps) {
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(width / height);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Update state on props change
  useEffect(() => {
    setCurrentWidth(width);
    setCurrentHeight(height);
    setAspectRatio(width / height);
  }, [width, height]);

  // Width change handler
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

  // Height change handler
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

  // Core Web Vitals optimization
  const optimizeForCoreWebVitals = () => {
    setIsOptimizing(true);

    const MAX_RECOMMENDED_WIDTH = 1000;
    const MAX_RECOMMENDED_HEIGHT = 800;

    let optimalWidth = Math.min(currentWidth, MAX_RECOMMENDED_WIDTH);
    let optimalHeight = Math.round(optimalWidth / aspectRatio);

    if (optimalHeight > MAX_RECOMMENDED_HEIGHT) {
      optimalHeight = MAX_RECOMMENDED_HEIGHT;
      optimalWidth = Math.round(optimalHeight * aspectRatio);
    }

    setCurrentWidth(optimalWidth);
    setCurrentHeight(optimalHeight);
    onResize(optimalWidth, optimalHeight);

    setTimeout(() => {
      onApplyResize();
      setIsOptimizing(false);
    }, 800);
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
            <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded-full animate-pulse">
              Compressing...
            </span>
          )}
        </CardTitle>
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

        <Button onClick={onDownload} variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardContent>
    </Card>
  );
}
