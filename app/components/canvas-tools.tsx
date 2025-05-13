"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { PaintToolRef } from "@/types/types";
import { PaintToolProps } from "@/types/types";
// Add the clear method to the PaintTool component
const PaintTool = forwardRef<PaintToolRef, PaintToolProps>(
  ({ imageUrl, onApplyPaint, onCancel, onToggleEraser, isEraser }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [localBrushSize, setLocalBrushSize] = useState(10);
    const [localBrushColor, setLocalBrushColor] = useState("#ff0000");

    // Initialize canvas with image
    useEffect(() => {
      if (!canvasRef.current || !imageUrl) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        contextRef.current = ctx;
      };
      img.src = imageUrl;
    }, [imageUrl]);

    // Drawing functions
    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!contextRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing || !contextRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    };

    const stopDrawing = () => {
      if (!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
    };

    // Set brush properties
    useEffect(() => {
      if (!contextRef.current) return;
      contextRef.current.lineWidth = localBrushSize;
      contextRef.current.strokeStyle = isEraser ? "#ffffff" : localBrushColor;
      contextRef.current.lineJoin = "round";
      contextRef.current.lineCap = "round";

      // For eraser, we use destination-out composite operation
      if (isEraser) {
        contextRef.current.globalCompositeOperation = "destination-out";
      } else {
        contextRef.current.globalCompositeOperation = "source-over";
      }
    }, [isEraser, localBrushSize, localBrushColor]);

    // Clear function to clear the canvas
    const clear = () => {
      if (!canvasRef.current || !contextRef.current) return;

      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw the original image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = imageUrl;
    };

    // Apply paint and get the data URL
    const getCanvasDataUrl = () => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL();
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl,
      clear,
    }));

    return (
      <div className="flex flex-col h-full">
        <div className="relative border rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-full cursor-crosshair"
          />
        </div>

        <div className="flex justify-between mt-4">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={() => {
              const dataUrl = getCanvasDataUrl();
              if (dataUrl) onApplyPaint(dataUrl);
            }}
            variant="default"
          >
            Apply Paint
          </Button>
        </div>
      </div>
    );
  }
);

PaintTool.displayName = "PaintTool";

export default PaintTool;
