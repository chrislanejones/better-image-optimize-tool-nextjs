"use client";

import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";

export interface CroppingToolRef {
  getCanvasDataUrl: () => string | null;
  getCrop: () => PixelCrop | null;
  getImageRef: () => HTMLImageElement | null;
  applyCrop: () => void;
}

interface CroppingToolProps {
  imageUrl: string;
  onApply: (croppedImageUrl: string) => void;
  onCancel: () => void;
  className?: string;
  aspectRatio?: number | undefined;
}

const CroppingTool = forwardRef<CroppingToolRef, CroppingToolProps>(
  ({ imageUrl, onApply, onCancel, className, aspectRatio }, ref) => {
    const [crop, setCrop] = useState<CropType>({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [error, setError] = useState<string | null>(null);

    // Function to create a cropped canvas
    const createCroppedCanvas = (
      image: HTMLImageElement,
      pixelCrop: PixelCrop
    ): HTMLCanvasElement | null => {
      if (!pixelCrop || !image) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setError("Could not get canvas context");
        return null;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      return canvas;
    };

    // Function to get the cropped image as data URL
    const getCroppedImageUrl = (): string | null => {
      if (!completedCrop || !imgRef.current) {
        setError("No crop area or image selected");
        return null;
      }

      try {
        const canvas = createCroppedCanvas(imgRef.current, completedCrop);
        if (!canvas) return null;
        return canvas.toDataURL("image/jpeg", 0.9);
      } catch (err) {
        setError("Failed to crop image");
        console.error("Crop error:", err);
        return null;
      }
    };

    // Function to apply the crop
    const applyCrop = useCallback(() => {
      const croppedUrl = getCroppedImageUrl();
      if (croppedUrl) {
        onApply(croppedUrl);
      } else {
        setError("Failed to apply crop");
      }
    }, [onApply]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: getCroppedImageUrl,
      getCrop: () => completedCrop,
      getImageRef: () => imgRef.current,
      applyCrop,
    }));

    return (
      <div className={`flex flex-col gap-4 w-full h-full ${className}`}>
        <div className="relative flex-1 border rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-white z-50">
              <p className="bg-red-600 px-4 py-2 rounded">{error}</p>
            </div>
          )}

          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-w-full max-h-full flex items-center justify-center"
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Image for cropping"
              className="max-w-full max-h-full object-contain"
              crossOrigin="anonymous"
            />
          </ReactCrop>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={applyCrop}
            variant="default"
            disabled={!completedCrop}
          >
            Apply Crop
          </Button>
        </div>
      </div>
    );
  }
);

CroppingTool.displayName = "CroppingTool";

export default CroppingTool;
