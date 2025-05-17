// Fixed cropping-tool.tsx with improved functionality
"use client";

import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
      width: 50, // Start with a smaller selection (50% of image)
      height: 50,
      x: 25, // Center the crop box
      y: 25,
    });
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHelp, setShowHelp] = useState<boolean>(true);

    // Hide help message after 6 seconds
    useEffect(() => {
      if (showHelp) {
        const timer = setTimeout(() => {
          setShowHelp(false);
        }, 6000);
        return () => clearTimeout(timer);
      }
    }, [showHelp]);

    // Handle image load event
    const onImageLoad = useCallback(() => {
      setImageLoaded(true);
    }, []);

    // Initialize crop when image loads
    useEffect(() => {
      // Reset crop state when image URL changes
      setCrop({
        unit: "%",
        width: 50,
        height: 50,
        x: 25,
        y: 25,
      });
      setCompletedCrop(null);
      setImageLoaded(false);
    }, [imageUrl]);

    // Function to create a cropped canvas
    const createCroppedCanvas = (
      image: HTMLImageElement,
      pixelCrop: PixelCrop
    ): HTMLCanvasElement | null => {
      if (!pixelCrop || !image) return null;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Could not get canvas context");
        return null;
      }

      // Calculate scaling factors between displayed image and natural image size
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Scale the crop coordinates and dimensions based on the actual image size
      const scaledX = pixelCrop.x * scaleX;
      const scaledY = pixelCrop.y * scaleY;
      const scaledWidth = pixelCrop.width * scaleX;
      const scaledHeight = pixelCrop.height * scaleY;

      // Set the canvas dimensions to the scaled cropped area size
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;

      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        image,
        scaledX,
        scaledY,
        scaledWidth,
        scaledHeight,
        0,
        0,
        scaledWidth,
        scaledHeight
      );

      return canvas;
    };

    // Function to get the cropped image as data URL
    const getCroppedImageUrl = (): string | null => {
      if (!completedCrop || !imgRef.current) {
        setError("No crop area or image selected");
        useToast().toast({
          title: "Error",
          description: "No crop area or image selected",
          variant: "destructive",
        });
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

    // Function to apply the crop - this is called from the parent component
    const applyCrop = useCallback(() => {
      if (!completedCrop) {
        setError("Please select an area to crop first");
        const toast = useToast();
        toast.toast({
          title: "Error",
          description: "Please select an area to crop first",
          variant: "destructive",
        });
        setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
        return;
      }

      const croppedUrl = getCroppedImageUrl();
      if (croppedUrl) {
        onApply(croppedUrl);
        const toast = useToast();
        toast.toast({
          title: "Success",
          description: "Crop applied successfully",
          variant: "default",
        });
      } else {
        setError("Failed to apply crop");
        const toast = useToast();
        toast.toast({
          title: "Error",
          description: "Failed to apply crop",
          variant: "destructive",
        });
      }
    }, [completedCrop, onApply]);

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

          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
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
              onLoad={onImageLoad}
            />
          </ReactCrop>

          {/* Help message */}
          {showHelp && imageLoaded && (
            <div className="crop-help-text">
              <Info className="inline-block mr-1 h-4 w-4" /> Drag to adjust crop
              area. Use toolbar buttons to apply or cancel.
            </div>
          )}
        </div>

        {/* Removed bottom buttons - using only toolbar buttons */}
      </div>
    );
  }
);

CroppingTool.displayName = "CroppingTool";

export default CroppingTool;
