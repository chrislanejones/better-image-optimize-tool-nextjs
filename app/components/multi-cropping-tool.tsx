// app/components/multi-cropping-tool.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Image from "next/image";
import { type MultiCroppingToolProps } from "@/types/editor";

export default function MultiCroppingTool({
  images,
  selectedImageId,
  onImageSelect,
  onApplyCrop,
  onCancel,
  zoom = 1,
}: MultiCroppingToolProps) {
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [previewMasks, setPreviewMasks] = useState<{ [key: string]: CropType }>(
    {}
  );

  // Reset crop state when selected image changes
  useEffect(() => {
    setCrop({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    });
    setCompletedCrop(null);
  }, [selectedImageId]);

  // Apply selected crop to preview masks for other images
  useEffect(() => {
    if (completedCrop) {
      const newMasks = { ...previewMasks };

      // Apply the same crop ratio to all images
      images.forEach((image) => {
        if (image.id !== selectedImageId) {
          newMasks[image.id] = {
            unit: "%",
            width: completedCrop.width,
            height: completedCrop.height,
            x: completedCrop.x,
            y: completedCrop.y,
          };
        }
      });

      setPreviewMasks(newMasks);
    }
  }, [completedCrop, selectedImageId, images]);

  const handleApplyCrop = () => {
    if (completedCrop && imgRef.current) {
      onApplyCrop(completedCrop, selectedImageId);
    }
  };

  // Find the selected image
  const selectedImage =
    images.find((img) => img.id === selectedImageId) || images[0];
  const otherImages = images.filter((img) => img.id !== selectedImageId);

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Main image with active cropping - takes 2/3 of the screen */}
        <div className="col-span-2 h-full relative border rounded-lg overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={undefined}
          >
            <img
              ref={imgRef}
              src={selectedImage.url}
              alt="Image for cropping"
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            />
          </ReactCrop>
        </div>

        {/* Grid of other images on the right side */}
        <div className="col-span-1 h-full overflow-auto">
          <div className="grid grid-cols-2 gap-2">
            {otherImages.map((image) => (
              <div
                key={image.id}
                className="relative border rounded-lg overflow-hidden cursor-pointer aspect-square"
                onClick={() => onImageSelect(image.id)}
              >
                <img
                  src={image.url}
                  alt="Preview image"
                  className="w-full h-full object-cover"
                />

                {/* Preview mask overlay */}
                {previewMasks[image.id] && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
                      style={{
                        left: `${previewMasks[image.id].x}%`,
                        top: `${previewMasks[image.id].y}%`,
                        width: `${previewMasks[image.id].width}%`,
                        height: `${previewMasks[image.id].height}%`,
                      }}
                    />
                  </div>
                )}

                {/* Selection indicator */}
                <div className="absolute inset-0 bg-blue-500/20 opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={handleApplyCrop}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Apply Crop to All
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-300 rounded-md">
          Cancel
        </button>
      </div>
    </div>
  );
}
