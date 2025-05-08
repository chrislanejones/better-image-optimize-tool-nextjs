"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Slider } from "@/components/ui/slider";
import {
  type BlurBrushCanvasProps,
  type BlurBrushCanvasRef,
} from "@/types/editor";

const BlurBrushCanvas = forwardRef<BlurBrushCanvasRef, BlurBrushCanvasProps>(
  (
    {
      imageUrl,
      blurAmount,
      blurRadius,
      zoom = 1,
      onBlurAmountChange,
      onBlurRadiusChange,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize canvas with image
    const initCanvas = useCallback(async () => {
      if (!imageUrl) {
        setError("No image URL provided");
        return;
      }

      try {
        const image = new Image();
        image.crossOrigin = "anonymous";

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
          canvas.style.width = "100%";
          canvas.style.height = "auto";

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError("Canvas context not available");
            return;
          }

          contextRef.current = ctx;
          ctx.drawImage(image, 0, 0);
          setError(null);
        };

        image.onerror = () => {
          setError("Failed to load image");
        };

        image.src = imageUrl;
      } catch (e) {
        setError(
          `Invalid image URL: ${
            e instanceof Error ? e.message : "Unknown error"
          }`
        );
      }
    }, [imageUrl]);

    // Clear the canvas and reset to original image
    const clear = useCallback(() => {
      if (!contextRef.current || !canvasRef.current || !baseImage) return;

      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Clear canvas and redraw original image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseImage, 0, 0);
    }, [baseImage]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: () => {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL("image/jpeg", 0.9);
        } catch (err) {
          setError("Failed to get canvas data");
          return null;
        }
      },
      clear,
    }));

    // Initialize canvas when component mounts or image changes
    useEffect(() => {
      initCanvas();
    }, [initCanvas]);

    // Drawing logic specific to blur tool
    const applyBlurEffect = useCallback(
      (x: number, y: number) => {
        if (
          !isDrawing ||
          !contextRef.current ||
          !canvasRef.current ||
          !baseImage
        )
          return;

        const canvas = canvasRef.current;
        const ctx = contextRef.current;

        // Create a temporary canvas for the blur effect
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;

        // Draw the original image and apply blur filter
        tempCtx.filter = `blur(${blurAmount}px)`;
        tempCtx.drawImage(baseImage, 0, 0);

        // Calculate area to blur, ensuring it stays within bounds
        const blurX = Math.max(0, x - blurRadius);
        const blurY = Math.max(0, y - blurRadius);
        const blurWidth = Math.min(blurRadius * 2, canvas.width - blurX);
        const blurHeight = Math.min(blurRadius * 2, canvas.height - blurY);

        if (blurWidth <= 0 || blurHeight <= 0) return;

        try {
          // Get the blurred portion of the image
          const blurredData = tempCtx.getImageData(
            blurX,
            blurY,
            blurWidth,
            blurHeight
          );
          // Apply it to the main canvas
          ctx.putImageData(blurredData, blurX, blurY);
        } catch (err) {
          setError("Error applying blur effect");
        }
      },
      [isDrawing, blurAmount, blurRadius, baseImage]
    );

    // Mouse event handlers
    const startDrawing = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);

        // Get coordinates and apply effect immediately
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const x = ((e.clientX - rect.left) * scaleX) / zoom;
          const y = ((e.clientY - rect.top) * scaleY) / zoom;

          applyBlurEffect(x, y);
        }
      },
      [applyBlurEffect, zoom]
    );

    const finishDrawing = useCallback(() => {
      setIsDrawing(false);
      if (contextRef.current) {
        contextRef.current.beginPath();
      }
    }, []);

    const draw = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = ((e.clientX - rect.left) * scaleX) / zoom;
        const y = ((e.clientY - rect.top) * scaleY) / zoom;

        applyBlurEffect(x, y);
      },
      [applyBlurEffect, zoom]
    );

    // Handle blur amount change
    const handleBlurAmountChange = useCallback(
      (value: number[]) => {
        if (onBlurAmountChange) {
          onBlurAmountChange(value[0]);
        }
      },
      [onBlurAmountChange]
    );

    // Handle blur radius change
    const handleBlurRadiusChange = useCallback(
      (value: number[]) => {
        if (onBlurRadiusChange) {
          onBlurRadiusChange(value[0]);
        }
      },
      [onBlurRadiusChange]
    );

    return (
      <div className="flex flex-col gap-4 w-full h-full">
        {/* Canvas area */}
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
            className="w-full max-w-full h-auto rounded border"
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            style={{
              display: isImageLoaded ? "block" : "none",
              cursor: "crosshair",
              transform: `scale(${zoom})`, // Apply zoom transform
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    );
  }
);

BlurBrushCanvas.displayName = "BlurBrushCanvas";

export default BlurBrushCanvas;
