"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
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
    },
    ref
  ) => {
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

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

    // Update context settings when eraser or brush properties change
    useEffect(() => {
      if (!contextRef.current) return;

      contextRef.current.lineWidth = brushSize;
      contextRef.current.lineCap = "round";

      if (isEraser) {
        contextRef.current.globalCompositeOperation = "destination-out";
      } else {
        contextRef.current.globalCompositeOperation = "source-over";
        contextRef.current.strokeStyle = brushColor;
      }
    }, [isEraser, brushColor, brushSize]);

    const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
      if (!contextRef.current) return;

      const { offsetX, offsetY } = nativeEvent;

      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);

      // Set these properties every time drawing starts
      contextRef.current.lineWidth = brushSize;
      contextRef.current.lineCap = "round";

      if (isEraser) {
        contextRef.current.globalCompositeOperation = "destination-out";
      } else {
        contextRef.current.globalCompositeOperation = "source-over";
        contextRef.current.strokeStyle = brushColor;
      }

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
      </div>
    );
  }
);

// Add display name for better debugging
PaintTool.displayName = "PaintTool";

export default PaintTool;
