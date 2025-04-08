"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface PaintToolProps {
  imageUrl: string;
  onApplyPaint: (paintedImageUrl: string) => void;
  onCancel: () => void;
  onToggleEraser: () => void;
  isEraser: boolean;
}

export default function PaintTool({
  imageUrl,
  onApplyPaint,
  onCancel,
  onToggleEraser,
  isEraser,
}: PaintToolProps) {
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [brushSize, setBrushSize] = useState<number>(10);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Load and setup the image
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    contextRef.current = context;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;

    image.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      // Draw the image onto the canvas
      context.drawImage(image, 0, 0);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!contextRef.current) return;

    if (isEraser) {
      contextRef.current.globalCompositeOperation = "destination-out";
    } else {
      contextRef.current.globalCompositeOperation = "source-over";
      contextRef.current.strokeStyle = brushColor;
    }
  }, [isEraser, brushColor]);

  // Update brush when eraser mode changes
  useEffect(() => {
    if (!contextRef.current) return;

    if (isEraser) {
      contextRef.current.globalCompositeOperation = "destination-out";
    } else {
      contextRef.current.globalCompositeOperation = "source-over";
      contextRef.current.strokeStyle = brushColor;
    }
  }, [isEraser, brushColor]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
    if (!contextRef.current) return;

    const { offsetX, offsetY } = nativeEvent;

    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    contextRef.current.lineWidth = brushSize;
    contextRef.current.lineCap = "round";
    contextRef.current.strokeStyle = isEraser ? "#ffffff" : brushColor; // Ensure color is updated here
    contextRef.current.globalCompositeOperation = isEraser
      ? "destination-out"
      : "source-over";

    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;

    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = nativeEvent;

    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const handleApply = () => {
    if (!canvasRef.current) return;

    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    onApplyPaint(dataUrl);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative border rounded-md overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          className="max-w-full cursor-crosshair"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={handleApply} variant="default">
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
