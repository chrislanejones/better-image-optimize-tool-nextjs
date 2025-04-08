"use client";

import { useRef, useState } from "react";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface CroppingToolProps {
  imageUrl: string;
  onApplyCrop: (crop: PixelCrop, imageRef: HTMLImageElement) => void;
  onCancel: () => void;
}

export default function CroppingTool({
  imageUrl,
  onApplyCrop,
  onCancel,
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
        />
      </ReactCrop>

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleApplyCrop}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={!completedCrop}
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}
