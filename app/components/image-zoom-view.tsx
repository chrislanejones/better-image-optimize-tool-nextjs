"use client";

import { useState, useEffect, useRef } from "react";
import { Minus, Plus, MousePointer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImageZoomViewProps {
  imageUrl: string;
}

interface MousePosition {
  x: number;
  y: number;
}

export default function ImageZoomView({ imageUrl }: ImageZoomViewProps) {
  const [magnifierZoom, setMagnifierZoom] = useState<number>(3);
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0.5,
    y: 0.5,
  });
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const increaseMagnifierZoom = () => {
    setMagnifierZoom((prev) => Math.min(prev + 0.5, 6));
  };

  const decreaseMagnifierZoom = () => {
    setMagnifierZoom((prev) => Math.max(prev - 0.5, 1.5));
  };

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
    <Card className="bg-gray-800 text-white border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-base">Zoom View</span>
          <div className="flex items-center gap-1">
            <Button
              onClick={decreaseMagnifierZoom}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xs">{magnifierZoom.toFixed(1)}x</span>
            <Button
              onClick={increaseMagnifierZoom}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="w-full h-full"
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
                <div className="absolute w-[1px] h-16 bg-red-500 left-1/2 -translate-x-1/2"></div>
                <div className="absolute h-[1px] w-16 bg-red-500 top-1/2 -translate-y-1/2"></div>
                <div className="w-16 h-16 rounded-sm border border-red-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
            {!isHovering && (
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <p className="text-xs text-white bg-black bg-opacity-50 py-1 px-2 rounded-md inline-block">
                  <MousePointer className="h-3 w-3 inline mr-1" />
                  Mouse over image to navigate
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
