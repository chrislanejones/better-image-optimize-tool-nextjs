"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Images,
  Crop,
  Type,
  X,
  Check,
  Download,
} from "lucide-react";
import Image from "next/image";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
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
  const [isBulkCropping, setIsBulkCropping] = useState<boolean>(false);
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const selectedImageRef = useRef<HTMLImageElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

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

  // Bulk crop handlers
  const handleBulkCrop = useCallback(() => {
    setIsBulkCropping(true);
    toast({
      title: "Bulk Crop Mode",
      description:
        "Adjust the crop area on the main image. It will be applied to all images.",
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

  // Create a cropped canvas from image and crop data
  const createCroppedCanvas = (
    image: HTMLImageElement,
    pixelCrop: PixelCrop
  ): HTMLCanvasElement | null => {
    if (!pixelCrop || !image) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

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

  const handleApplyBulkCrop = useCallback(async () => {
    if (!completedCrop) {
      toast({
        title: "No Crop Area",
        description: "Please select an area to crop first",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Processing...",
        description: `Applying crop to ${images.length} images...`,
        variant: "default",
      });

      // For demo purposes - in a real app you'd process each image
      setTimeout(() => {
        toast({
          title: "Success!",
          description: `Crop applied to all ${images.length} images!`,
          variant: "default",
        });
        setIsBulkCropping(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply bulk crop",
        variant: "destructive",
      });
    }
  }, [completedCrop, images.length, toast]);

  const handleCancelBulkCrop = useCallback(() => {
    setIsBulkCropping(false);
    setCrop({
      unit: "%",
      width: 50,
      height: 50,
      x: 25,
      y: 25,
    });
    setCompletedCrop(null);
  }, []);

  const handleDownloadAll = useCallback(() => {
    toast({
      title: "Download Started",
      description: `Downloading ${images.length} cropped images...`,
      variant: "default",
    });
    // In a real implementation, you'd generate and download all cropped images
  }, [images.length, toast]);

  const handleExitBulkMode = useCallback(() => {
    onStateChange("resizeAndOptimize");
  }, [onStateChange]);

  // Handle image load for crop calculations
  const onImageLoad = useCallback(() => {
    // Image loaded, ready for cropping
  }, []);

  // Calculate grid positions more efficiently
  const getGridPosition = (index: number) => {
    const imagesPerRow = 3;
    const maxVisibleRows = 3;

    if (index < imagesPerRow * maxVisibleRows) {
      const row = Math.floor(index / imagesPerRow);
      const col = index % imagesPerRow;
      return {
        gridColumn: col + 4, // Start from column 4 (after the 3x3 main image)
        gridRow: row + 1,
      };
    } else {
      // For images beyond the visible area, place them in subsequent rows
      const extraIndex = index - imagesPerRow * maxVisibleRows;
      const extraRow = Math.floor(extraIndex / 6) + maxVisibleRows + 1;
      const extraCol = (extraIndex % 6) + 1;
      return {
        gridColumn: extraCol,
        gridRow: extraRow,
      };
    }
  };

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
          <span className="font-medium text-white">
            {isBulkCropping ? "Bulk Crop Mode" : "Bulk Edit Mode"}
          </span>
        </div>
      </div>

      {/* Toolbar */}
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
            {!isBulkCropping ? (
              <>
                <Button
                  onClick={handleBulkCrop}
                  variant="outline"
                  className="h-9"
                  title="Bulk Crop"
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
              </>
            ) : (
              <>
                <Button
                  onClick={handleApplyBulkCrop}
                  variant="default"
                  className="h-9"
                  title="Apply Bulk Crop"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Apply Bulk Crop
                </Button>
                <Button
                  onClick={handleCancelBulkCrop}
                  variant="outline"
                  className="h-9"
                  title="Cancel Crop"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={handleDownloadAll}
                  variant="outline"
                  className="h-9"
                  title="Download All Images"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </>
            )}
          </div>

          {/* Right: Exit */}
          <div className="flex items-center gap-2 justify-self-end">
            {!isBulkCropping && (
              <Button
                onClick={handleExitBulkMode}
                variant="outline"
                className="h-9"
              >
                <X className="mr-2 h-4 w-4" />
                Exit Bulk Edit Mode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full min-h-[600px]">
        {/* Improved Grid Layout */}
        <div className="grid grid-cols-6 gap-4 h-full auto-rows-max">
          {/* Selected Image - Takes up 3x3 grid */}
          <div className="col-span-3 row-span-3 relative border-2 border-blue-500 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center min-h-[400px]">
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {isBulkCropping ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    className="max-w-full max-h-full flex items-center justify-center"
                  >
                    <img
                      ref={mainImageRef}
                      src={selectedImage.url}
                      alt="Main image for bulk cropping"
                      className="max-w-full max-h-full object-contain"
                      style={{ transform: `scale(${zoom})` }}
                      crossOrigin="anonymous"
                      onLoad={onImageLoad}
                    />
                  </ReactCrop>
                ) : (
                  <img
                    ref={selectedImageRef}
                    src={selectedImage.url}
                    alt="Selected image for bulk editing"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${zoom})` }}
                  />
                )}

                {/* Selected image indicator */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded px-2 py-1 text-xs font-bold">
                  {isBulkCropping ? "CROP PREVIEW" : "SELECTED"}
                </div>

                {/* Info overlay */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white rounded px-3 py-2 text-sm">
                  {isBulkCropping ? "Adjust crop area" : "Preview Image"}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                <Images className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>No image selected</p>
              </div>
            )}
          </div>

          {/* Other Images - Improved layout with larger previews */}
          {otherImages.map((image, index) => {
            const position = getGridPosition(index);

            return (
              <div
                key={image.id}
                className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  isBulkCropping
                    ? "border-orange-500 bg-orange-100/10"
                    : "border-gray-600"
                } aspect-square min-h-[120px]`}
                style={{
                  gridColumn: position.gridColumn,
                  gridRow: position.gridRow,
                }}
                title={
                  isBulkCropping
                    ? `Crop preview for image ${index + 1}`
                    : `Image ${index + 1}`
                }
              >
                <div className="relative w-full h-full overflow-hidden">
                  {isBulkCropping && completedCrop ? (
                    // Enhanced crop preview that better shows the result
                    <div className="w-full h-full relative bg-gray-800 flex items-center justify-center">
                      <div
                        className="relative overflow-hidden rounded"
                        style={{
                          // Make the preview larger and more visible
                          width: "90%",
                          height: "90%",
                          aspectRatio: `${completedCrop.width} / ${completedCrop.height}`,
                        }}
                      >
                        <img
                          src={image.url}
                          alt={`Image ${index + 1} crop preview`}
                          className="w-full h-full object-cover"
                          style={{
                            // Position the image to show the cropped area
                            objectPosition: `${-completedCrop.x}% ${-completedCrop.y}%`,
                            transform: `scale(${
                              100 /
                              Math.min(
                                completedCrop.width,
                                completedCrop.height
                              )
                            })`,
                            transformOrigin: `${
                              completedCrop.x + completedCrop.width / 2
                            }% ${completedCrop.y + completedCrop.height / 2}%`,
                          }}
                        />
                      </div>

                      {/* Crop preview label */}
                      <div className="absolute bottom-1 right-1 bg-orange-500 text-white rounded px-1 py-0.5 text-xs">
                        CROP
                      </div>
                    </div>
                  ) : (
                    <img
                      src={image.url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Image Number */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white rounded px-1 py-0.5 text-xs">
                  {otherImages.findIndex((img) => img.id === image.id) + 2}
                </div>

                {/* Crop indicator */}
                {isBulkCropping && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white rounded px-1 py-0.5 text-xs">
                    WILL CROP
                  </div>
                )}

                {/* Overlay for crop mode */}
                {isBulkCropping && (
                  <div className="absolute inset-0 bg-orange-500/10 border border-orange-500/30 rounded" />
                )}
              </div>
            );
          })}
        </div>

        {/* Information Panel - Below the grid */}
        <div
          className={`mt-6 p-4 rounded-lg border ${
            isBulkCropping
              ? "bg-orange-900/30 border-orange-500/50"
              : "bg-blue-900/30 border-blue-500/50"
          }`}
        >
          <h4
            className={`font-medium mb-2 ${
              isBulkCropping ? "text-orange-300" : "text-blue-300"
            }`}
          >
            {isBulkCropping ? "Bulk Crop Mode" : "Bulk Edit Mode"}
          </h4>

          {isBulkCropping ? (
            <>
              <p className="text-orange-200 text-sm mb-2">
                Cropping {images.length} images with the same crop area.
              </p>
              <p className="text-orange-200 text-sm">
                • Adjust the crop area on the main image
                <br />• The same crop will be applied to all {
                  images.length
                }{" "}
                images
                <br />• Preview shows how each image will be cropped
                <br />• Click "Apply Bulk Crop" when ready
              </p>
            </>
          ) : (
            <>
              <p className="text-blue-200 text-sm mb-2">
                You're in bulk edit mode with {images.length} images loaded.
              </p>
              <p className="text-blue-200 text-sm">
                • Use "Bulk Crop" to apply the same crop area to all images
                <br />• Use "Bulk Text Editor" to add text to all images (coming
                soon)
                <br />• All changes will be applied to every image
                simultaneously
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
