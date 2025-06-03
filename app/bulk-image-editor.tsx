// app/bulk-image-editor.tsx
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Images, Crop, Type, X } from "lucide-react";
import Image from "next/image";
import type {
  ImageFile,
  EditorState,
  NavigationDirection,
} from "@/types/types";

interface BulkImageEditorProps {
  images: ImageFile[];
  selectedImageId: string;
  onSelectImage: (imageId: string) => void;
  onStateChange: (state: EditorState) => void;
  onNavigateImage?: (direction: NavigationDirection) => void;
  onClose?: () => void;
  onRemoveAll?: () => void;
  onUploadNew?: () => void;
  currentPage?: number;
  totalPages?: number;
  className?: string;
}

export default function BulkImageEditor({
  images,
  selectedImageId,
  onSelectImage,
  onStateChange,
  onNavigateImage,
  onClose,
  onRemoveAll,
  onUploadNew,
  currentPage = 1,
  totalPages = 1,
  className = "",
}: BulkImageEditorProps) {
  const { toast } = useToast();
  const [zoom, setZoom] = useState<number>(1);
  const [padlockAnimation, setPadlockAnimation] = useState<boolean>(false);
  const selectedImageRef = useRef<HTMLImageElement>(null);

  // Find selected image
  const selectedImage = images.find((img) => img.id === selectedImageId);
  const otherImages = images.filter((img) => img.id !== selectedImageId);

  // Play padlock animation when component mounts
  useEffect(() => {
    setPadlockAnimation(true);
    const timer = setTimeout(() => {
      setPadlockAnimation(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // Bulk operation handlers (placeholder for now)
  const handleBulkCrop = useCallback(() => {
    toast({
      title: "Bulk Crop",
      description: "This feature is coming soon!",
      variant: "default",
    });
  }, [toast]);

  const handleBulkTextEditor = useCallback(() => {
    toast({
      title: "Bulk Text Editor",
      description: "This feature is coming soon!",
      variant: "default",
    });
  }, [toast]);

  const handleImageSelect = useCallback(
    (imageId: string) => {
      onSelectImage(imageId);
    },
    [onSelectImage]
  );

  const handleExitBulkMode = useCallback(() => {
    onStateChange("resizeAndOptimize");
  }, [onStateChange]);

  return (
    <div className={`flex flex-col gap-6 w-full h-full ${className}`}>
      {/* Padlock Indicator */}
      <div
        className={`w-full flex justify-center items-center mb-4 ${
          padlockAnimation ? "animate-pulse" : ""
        }`}
      >
        <div className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-gray-600 border border-gray-500">
          <Images
            className={`h-4 w-4 ${
              padlockAnimation ? "text-yellow-300" : "text-white"
            }`}
          />
          <span className="font-medium text-white">Bulk Edit Mode</span>
        </div>
      </div>

      {/* Toolbar - Following editImage pattern */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        <div className="w-full grid grid-cols-3 items-center">
          {/* Left: Zoom Controls */}
          <div className="flex items-center gap-2 justify-self-start">
            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-9 w-9 p-0"
              title="Zoom Out"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleZoomIn}
              variant="outline"
              className="h-9 w-9 p-0"
              title="Zoom In"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Center: Bulk Operations */}
          <div className="flex items-center gap-2 justify-self-center">
            <Button
              onClick={handleBulkCrop}
              variant="outline"
              className="h-9"
              disabled
              title="Bulk Crop (Coming Soon)"
            >
              <Crop className="mr-2 h-4 w-4" />
              Bulk Crop
            </Button>

            <Button
              onClick={handleBulkTextEditor}
              variant="outline"
              className="h-9"
              disabled
              title="Bulk Text Editor (Coming Soon)"
            >
              <Type className="mr-2 h-4 w-4" />
              Bulk Text Editor
            </Button>
          </div>

          {/* Right: Exit */}
          <div className="flex items-center gap-2 justify-self-end">
            <Button
              onClick={handleExitBulkMode}
              variant="outline"
              className="h-9"
            >
              <X className="mr-2 h-4 w-4" />
              Exit Bulk Edit Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full min-h-[600px]">
        {/* Grid Layout: Selected image (3x3) + Other images */}
        <div className="grid grid-cols-6 gap-2 h-full">
          {/* Selected Image - Takes up 3x3 grid (positions 0,0 to 2,2) */}
          <div className="col-span-3 row-span-3 relative border-2 border-blue-500 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  ref={selectedImageRef}
                  src={selectedImage.url}
                  alt="Selected image for bulk editing"
                  className="max-w-full max-h-full object-contain"
                  style={{ transform: `scale(${zoom})` }}
                />

                {/* Selected image indicator */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                  SELECTED
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white rounded px-3 py-2 text-sm">
                  Preview Image
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No image selected</p>
              </div>
            )}
          </div>

          {/* Other Images - Fill remaining grid positions */}
          {images
            .filter((img) => img.id !== selectedImageId)
            .map((image, index) => {
              // Calculate grid position
              let colStart, rowStart;

              if (index < 3) {
                // Top row: positions (3,0), (4,0), (5,0)
                colStart = index + 4;
                rowStart = 1;
              } else if (index < 6) {
                // Second row: positions (3,1), (4,1), (5,1)
                colStart = index - 3 + 4;
                rowStart = 2;
              } else if (index < 9) {
                // Third row: positions (3,2), (4,2), (5,2)
                colStart = index - 6 + 4;
                rowStart = 3;
              } else {
                // Fourth row and beyond: full width
                const fourthRowIndex = index - 9;
                colStart = (fourthRowIndex % 6) + 1;
                rowStart = 4 + Math.floor(fourthRowIndex / 6);
              }

              return (
                <div
                  key={image.id}
                  className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:border-gray-400 border-gray-600`}
                  style={{
                    gridColumn: colStart,
                    gridRow: rowStart,
                  }}
                  onClick={() => handleImageSelect(image.id)}
                  title={`Select image ${
                    images.findIndex((img) => img.id === image.id) + 1
                  } as main preview`}
                >
                  <img
                    src={image.url}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Image Number */}
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white rounded px-1 py-0.5 text-xs">
                    {images.findIndex((img) => img.id === image.id) + 1}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200" />
                </div>
              );
            })}
        </div>

        {/* Information Panel - Below the grid */}
        <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Bulk Edit Mode</h4>
          <p className="text-blue-200 text-sm mb-2">
            You're in bulk edit mode with {images.length} images loaded.
          </p>
          <p className="text-blue-200 text-sm">
            • Click any small image to make it the main preview
            <br />
            • Use "Bulk Crop" to apply cropping to all images (coming soon)
            <br />• Use "Bulk Text Editor" to add text to all images (coming
            soon)
          </p>
        </div>
      </div>
    </div>
  );
}
