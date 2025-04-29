"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface BlurBrushCanvasProps {
  imageUrl: string;
  blurAmount: number; // blur intensity (pixels)
  blurRadius: number; // brush radius (pixels)
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
}

export default function BlurBrushCanvas({
  imageUrl,
  blurAmount,
  blurRadius,
  onApply,
  onCancel,
}: BlurBrushCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);

  // Load image into canvas
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      setBaseImage(image);
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      contextRef.current = ctx;
      ctx.drawImage(image, 0, 0);
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e); // start immediately
  };

  const finishDrawing = () => {
    setIsDrawing(false);
    contextRef.current?.beginPath(); // reset path
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current || !baseImage)
      return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the original image section onto temp canvas and blur it
    tempCtx.filter = `blur(${blurAmount}px)`;
    tempCtx.drawImage(baseImage, 0, 0);
    const blurredData = tempCtx.getImageData(
      x - blurRadius,
      y - blurRadius,
      blurRadius * 2,
      blurRadius * 2
    );

    // Paste blurred portion back to main canvas
    contextRef.current.putImageData(
      blurredData,
      x - blurRadius,
      y - blurRadius
    );
  };

  const handleApply = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    onApply(dataUrl);
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        className="max-w-full cursor-crosshair border rounded-md"
      />
      <div className="mt-4 flex gap-2">
        <Button variant="default" onClick={handleApply}>
          Apply Blur
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
