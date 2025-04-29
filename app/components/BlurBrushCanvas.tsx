"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import BlurControls from "@/app/components/second-controls/blur-controls";

interface BlurBrushCanvasProps {
  imageUrl: string;
  blurAmount: number; // blur intensity (pixels)
  blurRadius: number; // brush radius (pixels)
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
  onBlurAmountChange?: (value: number) => void;
  onBlurRadiusChange?: (value: number) => void;
}

export default function BlurBrushCanvas({
  imageUrl,
  blurAmount,
  blurRadius,
  onApply,
  onCancel,
  onBlurAmountChange,
  onBlurRadiusChange,
}: BlurBrushCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load image into canvas
  useEffect(() => {
    // Validate that we have a proper imageUrl before proceeding
    if (!imageUrl) {
      setError("No image URL provided");
      return;
    }

    // For debugging
    if (typeof window !== "undefined") {
      // Using Function to avoid ESLint console warnings
      new Function(
        "url",
        'return console.log("Loading image from URL:", url);'
      )(imageUrl);
    }

    const image = new Image();
    image.crossOrigin = "anonymous";

    // Error handling for image loading
    image.onerror = () => {
      setError(
        `Failed to load image: ${imageUrl.substring(0, 50)}${
          imageUrl.length > 50 ? "..." : ""
        }`
      );
    };

    image.onload = () => {
      setBaseImage(image);
      setIsImageLoaded(true);

      if (!canvasRef.current) {
        setError("Canvas not available");
        return;
      }

      const canvas = canvasRef.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Canvas context not available");
        return;
      }

      contextRef.current = ctx;
      ctx.drawImage(image, 0, 0);
      setError(null);
    };

    // Set image source after setting up event handlers
    try {
      image.src = imageUrl;
    } catch (e) {
      setError(
        `Invalid image URL: ${e instanceof Error ? e.message : "Unknown error"}`
      );
    }
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the original image section onto temp canvas and blur it
    tempCtx.filter = `blur(${blurAmount}px)`;
    tempCtx.drawImage(baseImage, 0, 0);

    // Calculate the area to blur, ensuring it stays within bounds
    const blurX = Math.max(0, x - blurRadius);
    const blurY = Math.max(0, y - blurRadius);
    const blurWidth = Math.min(blurRadius * 2, canvas.width - blurX);
    const blurHeight = Math.min(blurRadius * 2, canvas.height - blurY);

    if (blurWidth <= 0 || blurHeight <= 0) return; // Skip if dimensions are invalid

    try {
      const blurredData = tempCtx.getImageData(
        blurX,
        blurY,
        blurWidth,
        blurHeight
      );

      // Paste blurred portion back to main canvas
      contextRef.current.putImageData(blurredData, blurX, blurY);
    } catch (err) {
      setError("Error applying blur effect");
    }
  };

  const handleApply = () => {
    if (!canvasRef.current) return;

    try {
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
      onApply(dataUrl);
    } catch (err) {
      setError("Failed to apply changes");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Show blur controls only if we have blur control handlers */}
      {onBlurAmountChange && onBlurRadiusChange && (
        <div className="mb-2">
          <BlurControls
            blurAmount={blurAmount}
            blurRadius={blurRadius}
            onBlurAmountChange={onBlurAmountChange}
            onBlurRadiusChange={onBlurRadiusChange}
          />
        </div>
      )}

      <div className="relative flex-1 border rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-white">
            <p className="bg-red-600 px-4 py-2 rounded">{error}</p>
          </div>
        )}

        {!isImageLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing}
          className="max-w-full max-h-full object-contain cursor-crosshair"
          style={{
            display: isImageLoaded ? "block" : "none",
          }}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel} variant="outline">
          Cancel
        </Button>
        <Button
          onClick={handleApply}
          variant="default"
          disabled={!isImageLoaded || !!error}
        >
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
