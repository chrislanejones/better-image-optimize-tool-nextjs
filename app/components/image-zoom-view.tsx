"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

import { ImageZoomViewProps, MousePosition } from "@/types/types"; // Adjust the import path as needed

export default function ImageZoomView({ imageUrl }: ImageZoomViewProps) {
  const [magnifierZoom, setMagnifierZoom] = useState<number>(3);
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0.5,
    y: 0.5,
  });
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const getBackgroundPosition = () => {
    if (isHovering) {
      return `${mousePosition.x * 100}% ${mousePosition.y * 100}%`;
    } else {
      return "50% 50%";
    }
  };

  return (
    <Card className="bg-gray-800 text-white border-gray-700 shadow-md">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Zoom Preview</span>
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono">
              {magnifierZoom.toFixed(1)}x
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Zoom slider */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              onClick={() =>
                setMagnifierZoom(Math.max(magnifierZoom - 0.5, 1.5))
              }
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
            >
              <Minus className="h-3 w-3" />
            </Button>

            <Slider
              value={[magnifierZoom]}
              min={1.5}
              max={6}
              step={0.5}
              onValueChange={(values) => setMagnifierZoom(values[0])}
              className="w-full [&>.slider-track]:bg-blue-500"
            />

            <Button
              onClick={() => setMagnifierZoom(Math.min(magnifierZoom + 0.5, 6))}
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Magnifier preview */}
          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-700 shadow-md"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className="w-full h-full transition-all duration-100"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundPosition: getBackgroundPosition(),
                backgroundSize: `${magnifierZoom * 100}%`,
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Crosshair */}
                  <div className="absolute w-[1px] h-12 bg-red-500 left-1/2 -translate-x-1/2"></div>
                  <div className="absolute h-[1px] w-12 bg-red-500 top-1/2 -translate-y-1/2"></div>
                  <div className="w-12 h-12 rounded-full border border-red-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                </div>
              </div>
              {!isHovering && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <p className="text-xs text-white bg-black bg-opacity-50 py-1 px-2 rounded-md inline-block">
                    <MousePointer className="h-3 w-3 inline mr-1" />
                    Hover to zoom
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
