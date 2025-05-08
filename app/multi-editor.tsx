"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  Crop,
  Droplets,
  Paintbrush,
  Type,
  X,
  RotateCcw,
  Download,
} from "lucide-react";
import { type ImageFile, type MultiImageEditorProps } from "@/types/editor";

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
            <Button
              onClick={zoomOut}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              onClick={zoomIn}
              variant="outline"
              size="icon"
              className="h-9 w-9"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline">
            <Crop className="mr-2 h-4 w-4" />
            Multi Crop
          </Button>

          <Button variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" />
            Batch Resize
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onBackToGallery} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Exit Multi Edit
          </Button>
        </div>
      </div>

      {/* Grid layout for multiple images */}
      <div className="parent grid grid-cols-3 md:grid-cols-6 gap-2">
        {/* Main selected image - larger */}
        <div className="div1 col-span-2 row-span-2 relative border rounded-lg overflow-hidden">
          {selectedImage && (
            <div className="w-full h-full relative">
              <img
                src={selectedImage.url}
                alt="Selected image"
                className="w-full h-full object-contain transform origin-center"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          )}
        </div>

        {/* Thumbnail grid for other images */}
        {images.map((image, index) => {
          if (selectedImage && image.id === selectedImage.id) return null;
          if (index >= 11) return null; // Limit to 11 additional images

          // Calculate the grid area class based on index
          const areaIndex = index + 2; // +2 because we start from div2 (main image is div1)
          const gridClass = `div${areaIndex}`;

          return (
            <div
              key={image.id}
              className={`${gridClass} relative aspect-square cursor-pointer border rounded-md overflow-hidden ${
                selectedImage && image.id === selectedImage.id
                  ? "ring-2 ring-blue-500"
                  : ""
              }`}
              onClick={() => handleSelectImage(image)}
            >
              <Image
                src={image.url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {/* Controls for multi-image operations */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800 rounded-lg">
        <div>
          <h3 className="text-lg font-medium mb-2">Batch Operations</h3>
          <p className="text-sm text-gray-400 mb-4">
            Apply the same edits to multiple images at once
          </p>
          <div className="space-y-2">
            <Button className="w-full justify-start">
              <Droplets className="mr-2 h-4 w-4" />
              Apply Watermark to All
            </Button>
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
            <Button className="w-full justify-start" disabled={!selectedImage}>
              <Paintbrush className="mr-2 h-4 w-4" />
              Edit Selected Image
            </Button>
            <Button
              className="w-full justify-start"
              variant="destructive"
              disabled={!selectedImage}
            >
              <X className="mr-2 h-4 w-4" />
              Remove from Batch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
