"use client";

import { useRef, useState, useEffect } from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Image from "next/image";

interface MultiCroppingToolProps {
  images: Array<{
    id: string;
    url: string;
  }>;
  selectedImageId: string;
  onImageSelect: (id: string) => void;
  onApplyCrop: (crop: PixelCrop, imageId: string) => void;
  onCancel: () => void;
  zoom?: number;
}

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
      <div className="grid grid-cols-5 grid-rows-7 gap-2 h-full">
        {/* Main image with active cropping */}
        <div className="col-span-2 row-span-4 relative border rounded-lg overflow-hidden">
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

        {/* Preview images with crop outline */}
        {otherImages.slice(0, 14).map((image, index) => {
          // Calculate grid position based on index
          const position = index + 2; // Start from position 2 (div2)
          let gridArea = "";

          if (position === 2) gridArea = "1 / 3 / 2 / 4";
          else if (position === 3) gridArea = "1 / 4 / 2 / 5";
          else if (position === 4) gridArea = "2 / 3 / 3 / 4";
          else if (position === 5) gridArea = "2 / 4 / 3 / 5";
          else if (position === 6) gridArea = "3 / 3 / 4 / 4";
          else if (position === 7) gridArea = "3 / 4 / 4 / 5";
          else if (position === 8) gridArea = "4 / 1 / 5 / 2";
          else if (position === 9) gridArea = "4 / 2 / 5 / 3";
          else if (position === 10) gridArea = "4 / 3 / 5 / 4";
          else if (position === 11) gridArea = "4 / 4 / 5 / 5";
          else if (position === 12) gridArea = "5 / 1 / 6 / 2";
          else if (position === 13) gridArea = "5 / 2 / 6 / 3";
          else if (position === 14) gridArea = "5 / 3 / 6 / 4";
          else if (position === 15) gridArea = "5 / 4 / 6 / 5";

          return (
            <div
              key={image.id}
              style={{ gridArea }}
              className="relative border rounded-lg overflow-hidden cursor-pointer"
              onClick={() => onImageSelect(image.id)}
            >
              <img
                src={image.url}
                alt={`Preview image ${index + 1}`}
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
          );
        })}
      </div>
    </div>
  );
}
