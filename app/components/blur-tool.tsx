"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BlurControls from "./second-controls/blur-controls";

interface BlurToolProps {
  imageUrl: string;
  onApplyBlur: (blurredImageUrl: string) => void;
  onCancel: () => void;
}

export default function BlurTool({
  imageUrl,
  onApplyBlur,
  onCancel,
}: BlurToolProps) {
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load and setup the image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      imgRef.current = img;
      applyBlurEffect(blurAmount);
    };

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [imageUrl]);

  // Apply blur when slider changes
  useEffect(() => {
    if (imgRef.current) {
      applyBlurEffect(blurAmount);
    }
  }, [blurAmount]);

  const applyBlurEffect = (amount: number) => {
    if (!canvasRef.current || !imgRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = imgRef.current.naturalWidth;
    canvas.height = imgRef.current.naturalHeight;

    // Draw the original image
    ctx.drawImage(imgRef.current, 0, 0);

    // Apply CSS filter for blur
    if (amount > 0) {
      ctx.filter = `blur(${amount}px)`;
      ctx.drawImage(imgRef.current, 0, 0);
      ctx.filter = "none";
    }

    // Generate preview URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleApply = () => {
    if (previewUrl) {
      onApplyBlur(previewUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="max-w-full"
          style={{ cursor: "crosshair" }}
        />
        <img
          src={imageUrl}
          alt="Image for blurring"
          className="hidden"
          ref={imgRef}
        />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleApply}>Apply Blur</Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
