// app/multi-editor.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Crop,
  RotateCcw,
  Download,
  Check,
  Images,
  X,
} from "lucide-react";
import { type ImageFile, type MultiImageEditorProps } from "@/types/editor";
import { type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import MultiCroppingTool from "../components/multi-cropping-tool";

export default function MultiImageEditor({
  images,
  onUploadNew,
  onRemoveAll,
  onBackToGallery,
  selectedImageId,
}: MultiImageEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find the initially selected image
  useEffect(() => {
    if (images.length > 0) {
      const initialImage = selectedImageId
        ? images.find((img) => img.id === selectedImageId) || images[0]
        : images[0];

      setSelectedImage(initialImage);
    }
  }, [images, selectedImageId]);

  // Zoom controls
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Handle image selection
  const handleSelectImage = (image: ImageFile) => {
    setSelectedImage(image);
  };

  // Toggle cropping
  const toggleCropping = () => {
    setIsCropping(!isCropping);
  };

  // Apply crop
  const handleApplyCrop = (crop: PixelCrop, imageId: string) => {
    // Here you would implement the actual cropping logic
    // For now, we'll just exit cropping mode
    setIsCropping(false);
  };

  // Cancel crop
  const handleCancelCrop = () => {
    setIsCropping(false);
  };

  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-64 w-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 mr-2">
            <Button onClick={zoomOut} variant="outline" className="h-9">
              <Minus className="h-4 w-4" />
            </Button>
            <Button onClick={zoomIn} variant="outline" className="h-9">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tool buttons */}
          {!isCropping ? (
            <>
              <Button
                variant="outline"
                onClick={toggleCropping}
                className="h-9"
              >
                <Crop className="mr-2 h-4 w-4" />
                Multi Crop
              </Button>

              <Button variant="outline" className="h-9">
                <RotateCcw className="mr-2 h-4 w-4" />
                Batch Resize
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                onClick={() => setIsCropping(false)}
                className="h-9"
              >
                <Check className="mr-2 h-4 w-4" />
                Apply Crop
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCropping ? (
            <Button
              onClick={handleCancelCrop}
              variant="outline"
              className="h-9"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel Crop
            </Button>
          ) : (
            <Button onClick={onBackToGallery} variant="outline" className="h-9">
              <Images className="mr-2 h-4 w-4" />
              Exit Multi Edit
            </Button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="min-h-[75vh]">
        {isCropping ? (
          <MultiCroppingTool
            images={images.map((img) => ({ id: img.id, url: img.url }))}
            selectedImageId={selectedImage?.id || images[0]?.id || ""}
            onImageSelect={(id) => {
              const img = images.find((img) => img.id === id);
              if (img) handleSelectImage(img);
            }}
            onApplyCrop={handleApplyCrop}
            onCancel={handleCancelCrop}
            zoom={zoom}
          />
        ) : (
          <div className="grid grid-cols-3 gap-4 h-[75vh]">
            {/* Main selected image - larger */}
            <div className="col-span-2 h-full">
              {selectedImage && (
                <div className="w-full h-full relative border rounded-lg overflow-hidden">
                  <img
                    src={selectedImage.url}
                    alt="Selected image"
                    className="w-full h-full object-contain"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              )}
            </div>

            {/* Grid for other images */}
            <div className="col-span-1 h-full overflow-auto">
              <div className="grid grid-cols-2 gap-2">
                {images.map((image) => {
                  if (selectedImage && image.id === selectedImage.id)
                    return null;

                  return (
                    <div
                      key={image.id}
                      className="relative border rounded-lg overflow-hidden cursor-pointer aspect-square"
                      onClick={() => handleSelectImage(image)}
                    >
                      <img
                        src={image.url}
                        alt={`Image ${image.id}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="default"
                            className="text-xs"
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls for multi-image operations */}
      {!isCropping && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
          <div>
            <h3 className="text-lg font-medium mb-2">Batch Operations</h3>
            <p className="text-sm text-gray-400 mb-4">
              Apply the same edits to multiple images at once
            </p>
            <div className="space-y-2">
              <Button className="w-full justify-start">
                <Download className="mr-2 h-4 w-4" />
                Export All Images
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Selected Image</h3>
            <p className="text-sm text-gray-400 mb-4">
              {selectedImage
                ? `Editing: ${selectedImage.file.name}`
                : "No image selected"}
            </p>
            <div className="space-y-2">
              <Button
                className="w-full justify-start"
                disabled={!selectedImage}
              >
                <Crop className="mr-2 h-4 w-4" />
                Edit Selected Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
