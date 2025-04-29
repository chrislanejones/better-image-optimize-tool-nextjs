"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import BlurBrushCanvas from "@/app/components/BlurBrushCanvas";
import PaintTool from "@/app/components/paint-tool";
import BlurControls from "@/app/components/second-controls/blur-controls";
// Add the missing import for PaintControls
import PaintControls from "@/app/components/second-controls/paint-controls";

import {
  Upload,
  X,
  Maximize2,
  Crop,
  Droplets,
  Paintbrush,
  Minus,
  Plus,
  Eraser,
} from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

export default function ImageEditor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [blurAmount, setBlurAmount] = useState(5);
  const [blurRadius, setBlurRadius] = useState(10);
  const [isEraser, setIsEraser] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState("#ff0000");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug logging - using safe approach for ESLint
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      try {
        // eslint-disable-next-line no-console
        console.log(
          "Selected image changed:",
          selectedImage
            ? {
                id: selectedImage.id,
                url: selectedImage.url?.substring(0, 30) + "...",
                hasFile: !!selectedImage.file,
              }
            : null
        );
      } catch (e) {
        // Silently fail in production
      }
    }
  }, [selectedImage]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);

    // Auto-select first image
    if (newImages.length > 0 && images.length === 0) {
      setSelectedImage(newImages[0]);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  return (
    <div className="container mx-auto py-8">
      {!selectedImage && (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Upload Images</h2>
          <p className="text-muted-foreground text-center">
            Drag and drop your images here or click below
          </p>
          <Button onClick={handleUploadClick}>Select Images</Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {images.length > 0 && !selectedImage && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <Image
                src={img.url}
                alt="Uploaded"
                width={300}
                height={300}
                className="rounded"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex justify-center items-center gap-2 transition">
                <Button size="sm" onClick={() => setSelectedImage(img)}>
                  <Maximize2 size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(img.id)}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <div className="space-y-4">
          {/* Main Edit Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2 bg-gray-700 p-2 rounded-lg z-10 relative">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
                <Button variant="outline">
                  <Minus className="h-4 w-4" />
                </Button>
                <Button variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline">
                <Crop className="mr-2 h-4 w-4" />
                Crop Image
              </Button>
              <Button
                variant={isBlurring ? "default" : "outline"}
                onClick={() => {
                  setIsBlurring(!isBlurring);
                  setIsPainting(false);
                }}
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>
              <Button
                variant={isPainting ? "default" : "outline"}
                onClick={() => {
                  setIsPainting(!isPainting);
                  setIsBlurring(false);
                }}
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isPainting && (
                <Button onClick={() => setIsEraser((v) => !v)}>
                  <Eraser className="mr-2 h-4 w-4" />
                  {isEraser ? "Brush" : "Eraser"}
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsEditMode(false);
                  setIsPainting(false);
                  setIsBlurring(false);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Exit Edit Mode
              </Button>
            </div>
          </div>

          {/* Tool-specific controls */}
          {isBlurring && (
            <div className="mb-2">
              <BlurControls
                blurAmount={blurAmount}
                blurRadius={blurRadius}
                onBlurAmountChange={setBlurAmount}
                onBlurRadiusChange={setBlurRadius}
              />
            </div>
          )}

          {isPainting && (
            <div className="mb-2">
              <PaintControls
                brushSize={brushSize}
                brushColor={brushColor}
                onBrushSizeChange={setBrushSize}
                onBrushColorChange={setBrushColor}
              />
            </div>
          )}

          {/* Main Canvas Area */}
          <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-black">
            {isPainting ? (
              <PaintTool
                imageUrl={selectedImage.url}
                isEraser={isEraser}
                onToggleEraser={() => setIsEraser((v) => !v)}
                onApplyPaint={(dataUrl) => {
                  setSelectedImage({ ...selectedImage, url: dataUrl });
                  setIsPainting(false);
                }}
                onCancel={() => setIsPainting(false)}
              />
            ) : isBlurring ? (
              <BlurBrushCanvas
                imageUrl={selectedImage.url}
                blurAmount={blurAmount}
                blurRadius={blurRadius}
                onBlurAmountChange={setBlurAmount}
                onBlurRadiusChange={setBlurRadius}
                onApply={(dataUrl) => {
                  setSelectedImage({ ...selectedImage, url: dataUrl });
                  setIsBlurring(false);
                }}
                onCancel={() => setIsBlurring(false)}
              />
            ) : (
              <div className="h-full w-full flex justify-center items-center">
                {selectedImage.url ? (
                  <img
                    src={selectedImage.url}
                    alt="Editable"
                    className="object-contain max-h-full max-w-full"
                  />
                ) : (
                  <div className="text-white">No image available</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
