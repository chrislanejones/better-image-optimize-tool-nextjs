"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { type CroppingToolProps } from "@/types/editor";

export default function CroppingTool({
  imageUrl,
  onApplyCrop,
  onCancel,
  zoom = 1,
}: CroppingToolProps) {
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleApplyCrop = () => {
    if (completedCrop && imgRef.current) {
      onApplyCrop(completedCrop, imgRef.current);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ReactCrop
        crop={crop}
        onChange={(c) => setCrop(c)}
        onComplete={(c) => setCompletedCrop(c)}
        aspect={undefined}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Image for cropping"
          className="max-w-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
        />
      </ReactCrop>
      {/* Removed the bottom buttons */}
    </div>
  );
}
