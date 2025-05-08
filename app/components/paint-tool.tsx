"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { type PaintToolProps, type PaintToolRef } from "@/types/editor";

const PaintTool = forwardRef<PaintToolRef, PaintToolProps>(
  (
    {
      imageUrl,
      onApplyPaint,
      onCancel,
      onToggleEraser,
      isEraser,
      brushColor = "#ff0000",
      brushSize = 10,
      zoom = 1,
    },
    ref
  ) => {
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Expose the getCanvasDataUrl method via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: () => {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL("image/jpeg", 0.9);
        } catch (err) {
          console.error("Failed to get canvas data", err);
          return null;
        }
      },
    }));

    // Load and setup the image
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Could not get canvas context");
        return;
      }

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

      image.onerror = () => {
        setError("Failed to load image");
      };
    }, [imageUrl]);

    // Update context settings when eraser or brush properties change
    useEffect(() => {
      if (!contextRef.current) return;

      contextRef.current.lineWidth = brushSize;
      contextRef.current.lineCap = "round";
      contextRef.current.lineJoin = "round"; // Add round line joins for smoother connections

      // FIXED: Set the proper composite operation for eraser/brush mode
      if (isEraser) {
        contextRef.current.globalCompositeOperation = "destination-out";
      } else {
        contextRef.current.globalCompositeOperation = "source-over";
        contextRef.current.strokeStyle = brushColor;
      }

      console.log("Brush settings updated:", {
        isEraser,
        brushSize,
        brushColor,
        compositeOperation: contextRef.current.globalCompositeOperation,
      });
    }, [isEraser, brushColor, brushSize]);

    const startDrawing = useCallback(
      ({ nativeEvent }: React.MouseEvent) => {
        if (!contextRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Account for zoom
        const offsetX = (nativeEvent.offsetX * scaleX) / zoom;
        const offsetY = (nativeEvent.offsetY * scaleY) / zoom;

        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);

        // Set these properties every time drawing starts
        contextRef.current.lineWidth = brushSize;
        contextRef.current.lineCap = "round";
        contextRef.current.lineJoin = "round";

        // FIXED: Ensure correct composite operation is set before each drawing action
        if (isEraser) {
          contextRef.current.globalCompositeOperation = "destination-out";
        } else {
          contextRef.current.globalCompositeOperation = "source-over";
          contextRef.current.strokeStyle = brushColor;
        }

        setIsDrawing(true);
      },
      [brushColor, brushSize, isEraser, zoom]
    );

    const finishDrawing = useCallback(() => {
      if (!contextRef.current) return;

      contextRef.current.closePath();
      setIsDrawing(false);
    }, []);

    const draw = useCallback(
      ({ nativeEvent }: React.MouseEvent) => {
        if (!isDrawing || !contextRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Account for zoom
        const offsetX = (nativeEvent.offsetX * scaleX) / zoom;
        const offsetY = (nativeEvent.offsetY * scaleY) / zoom;

        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
      },
      [isDrawing, zoom]
    );

    return (
      <div className="flex flex-col gap-4">
        {error && (
          <div className="bg-red-500 text-white p-2 rounded-md mb-2">
            {error}
          </div>
        )}
        <div className="relative border rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            className="max-w-full cursor-crosshair"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          />
        </div>
      </div>
    );
  }
);

// Add display name for better debugging
PaintTool.displayName = "PaintTool";

export default PaintTool;
