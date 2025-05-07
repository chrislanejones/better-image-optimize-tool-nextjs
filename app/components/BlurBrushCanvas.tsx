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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  Droplets,
  RotateCcw,
  MinusIcon,
  PlusIcon,
} from "lucide-react";

// Export the ref type so it can be imported by other components
export interface BlurBrushCanvasRef {
  getCanvasDataUrl: () => string | null;
  clear: () => void;
}

interface BlurBrushCanvasProps {
  imageUrl: string;
  initialBlurAmount?: number;
  initialBlurRadius?: number;
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
}

const BlurBrushCanvas = forwardRef<BlurBrushCanvasRef, BlurBrushCanvasProps>(
  (
    {
      imageUrl,
      initialBlurAmount = 5,
      initialBlurRadius = 10,
      onApply,
      onCancel,
    },
    ref
  ) => {
    // State for blur settings
    const [blurAmount, setBlurAmount] = useState(initialBlurAmount);
    const [blurRadius, setBlurRadius] = useState(initialBlurRadius);
    const [isDrawing, setIsDrawing] = useState(false);
    const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Canvas references
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

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
      [isDrawing, blurAmount, blurRadius]
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
          const x = (e.clientX - rect.left) * scaleX;
          const y = (e.clientY - rect.top) * scaleY;

          applyBlurEffect(x, y);
        }
      },
      [applyBlurEffect]
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
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        applyBlurEffect(x, y);
      },
      [applyBlurEffect]
    );

    // Handler functions for controls
    const decreaseBlurAmount = useCallback(() => {
      setBlurAmount((prev) => Math.max(prev - 1, 1));
    }, []);

    const increaseBlurAmount = useCallback(() => {
      setBlurAmount((prev) => Math.min(prev + 1, 20));
    }, []);

    const decreaseBlurRadius = useCallback(() => {
      setBlurRadius((prev) => Math.max(prev - 1, 1));
    }, []);

    const increaseBlurRadius = useCallback(() => {
      setBlurRadius((prev) => Math.min(prev + 1, 50));
    }, []);

    const handleApply = useCallback(() => {
      if (!canvasRef.current) return;

      setIsProcessing(true);
      try {
        const dataUrl = canvasRef.current?.toDataURL("image/jpeg", 0.9);
        if (dataUrl) {
          onApply(dataUrl);
        }
      } catch (error) {
        console.error("Error applying blur:", error);
      } finally {
        setIsProcessing(false);
      }
    }, [onApply]);

    return (
      <div className="flex flex-col gap-4 w-full h-full">
        {/* Blur controls */}
        <div className="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="blur-amount"
                  className="text-sm font-medium text-white"
                >
                  Blur Amount: {blurAmount}px
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={decreaseBlurAmount}
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md"
                    aria-label="Decrease blur amount"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={increaseBlurAmount}
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md"
                    aria-label="Increase blur amount"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="blur-amount"
                min={1}
                max={20}
                step={1}
                value={[blurAmount]}
                onValueChange={(value) => setBlurAmount(value[0])}
                className="[&_.slider-track]:bg-gray-500"
                aria-label="Blur amount"
              />
              <p className="text-xs text-gray-300">
                Controls the intensity of the blur effect
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="blur-radius"
                  className="text-sm font-medium text-white"
                >
                  Brush Size: {blurRadius}px
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={decreaseBlurRadius}
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md"
                    aria-label="Decrease brush size"
                  >
                    <MinusIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={increaseBlurRadius}
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-md"
                    aria-label="Increase brush size"
                  >
                    <PlusIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Slider
                id="blur-radius"
                min={1}
                max={50}
                step={1}
                value={[blurRadius]}
                onValueChange={(value) => setBlurRadius(value[0])}
                className="[&_.slider-track]:bg-gray-500"
                aria-label="Brush size"
              />
              <p className="text-xs text-gray-300">
                Controls the size of the blur brush
              </p>
            </div>
          </div>
        </div>

        {/* Canvas toolbar */}
        <Card className="bg-gray-800 border-gray-700 p-2 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-400" />
              <h3 className="text-sm font-medium text-white">Blur Tool</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={clear}
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="h-8"
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                variant="default"
                size="sm"
                className="h-8"
                disabled={isProcessing || !isImageLoaded}
              >
                <Check className="h-4 w-4 mr-1" />
                Apply
              </Button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="relative border rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
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
              }}
            />
          </div>

          <div className="mt-2 px-2">
            <p className="text-xs text-gray-400">
              Paint over areas you want to blur. Adjust blur amount and brush
              size using the controls above.
            </p>
          </div>
        </Card>
      </div>
    );
  }
);

// Add display name for better debugging
BlurBrushCanvas.displayName = "BlurBrushCanvas";

export default BlurBrushCanvas;
