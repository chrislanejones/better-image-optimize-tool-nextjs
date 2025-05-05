// components/ImageEditor.tsx
"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BlurControls, PaintControls } from "@/app/components/editor-controls";
import BlurBrushCanvas, { type BlurBrushCanvasRef } from "./BlurBrushCanvas";
import PaintTool, { type PaintToolRef } from "@/app/components/paint-tool";
import { imageDB } from "@/app/utils/indexedDB";
import { useImageStore, useImageActions } from "@/store/useImageStore";
import { useImageControls } from "@/store/hooks/useImageControls";
import { useFileOperations } from "@/store/hooks/useFileOperations";
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
  Check,
} from "lucide-react";

export default function ImageEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blurCanvasRef = useRef<BlurBrushCanvasRef>(null);
  const paintToolRef = useRef<PaintToolRef>(null);

  // Zustand state
  const {
    images,
    selectedImage,
    isEditMode,
    isBlurring,
    isPainting,
    blurAmount,
    blurRadius,
    isEraser,
    brushSize,
    brushColor,
  } = useImageStore();

  // Zustand actions
  const actions = useImageActions();

  // Custom hooks
  const { toggleBlurring, togglePainting } = useImageControls();
  const { handleFileChange } = useFileOperations();

  // Handle uploading new images
  const handleUploadClick = () => fileInputRef.current?.click();

  const removeImage = async (id: string) => {
    actions.removeImage(id);
    try {
      await imageDB.deleteImage(id);
    } catch (error) {
      console.error("Error removing image from DB:", error);
    }
  };

  // Handle applying blur from the main toolbar
  const handleApplyBlur = () => {
    if (blurCanvasRef.current && selectedImage) {
      const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
      if (dataUrl) {
        // Update the selected image with the new URL
        actions.selectImage({
          ...selectedImage,
          url: dataUrl,
        });

        // Update the image in the images array
        const updatedImages = images.map((img) =>
          img.id === selectedImage.id ? { ...img, url: dataUrl } : img
        );
        actions.setImages(updatedImages);

        actions.setIsBlurring(false);
        actions.setHasEdited(true);
      }
    }
  };

  // Handle applying paint from the main toolbar
  const handleApplyPaint = () => {
    if (paintToolRef.current && selectedImage) {
      const dataUrl = paintToolRef.current.getCanvasDataUrl();
      if (dataUrl) {
        // Update the selected image with the new URL
        actions.selectImage({
          ...selectedImage,
          url: dataUrl,
        });

        // Update the image in the images array
        const updatedImages = images.map((img) =>
          img.id === selectedImage.id ? { ...img, url: dataUrl } : img
        );
        actions.setImages(updatedImages);

        actions.setIsPainting(false);
        actions.setHasEdited(true);
      }
    }
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
                <Button size="sm" onClick={() => actions.selectImage(img)}>
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
                  toggleBlurring();
                  actions.setIsPainting(false);
                }}
              >
                <Droplets className="mr-2 h-4 w-4" />
                Blur Tool
              </Button>
              <Button
                variant={isPainting ? "default" : "outline"}
                onClick={() => {
                  togglePainting();
                  actions.setIsBlurring(false);
                }}
              >
                <Paintbrush className="mr-2 h-4 w-4" />
                Paint Tool
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isPainting && (
                <>
                  <Button onClick={() => actions.setIsEraser(!isEraser)}>
                    <Eraser className="mr-2 h-4 w-4" />
                    {isEraser ? "Brush" : "Eraser"}
                  </Button>
                  <Button onClick={handleApplyPaint} variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Apply Paint
                  </Button>
                  <Button
                    onClick={() => actions.setIsPainting(false)}
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Paint
                  </Button>
                </>
              )}
              {isBlurring && (
                <>
                  <Button onClick={handleApplyBlur} variant="default">
                    <Check className="mr-2 h-4 w-4" />
                    Apply Blur
                  </Button>
                  <Button
                    onClick={() => actions.setIsBlurring(false)}
                    variant="destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Blur
                  </Button>
                </>
              )}
              {!isBlurring && !isPainting && (
                <Button
                  onClick={() => {
                    actions.setIsEditMode(false);
                    actions.setIsPainting(false);
                    actions.setIsBlurring(false);
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Exit Edit Mode
                </Button>
              )}
            </div>
          </div>

          {/* Tool-specific controls */}
          {isBlurring && (
            <div className="mb-2">
              <BlurControls
                blurAmount={blurAmount}
                blurRadius={blurRadius}
                onBlurAmountChange={actions.setBlurAmount}
                onBlurRadiusChange={actions.setBlurRadius}
              />
            </div>
          )}

          {isPainting && (
            <div className="mb-2">
              <PaintControls
                brushSize={brushSize}
                brushColor={brushColor}
                onBrushSizeChange={actions.setBrushSize}
                onBrushColorChange={actions.setBrushColor}
              />
            </div>
          )}

          {/* Main Canvas Area */}
          <div className="relative w-full h-[70vh] border rounded-lg overflow-hidden bg-black">
            {isPainting ? (
              <PaintTool
                ref={paintToolRef}
                imageUrl={selectedImage.url}
                isEraser={isEraser}
                onToggleEraser={() => actions.setIsEraser(!isEraser)}
                onApplyPaint={(dataUrl) => {
                  actions.selectImage({ ...selectedImage, url: dataUrl });
                  actions.setIsPainting(false);
                  actions.setHasEdited(true);
                }}
                onCancel={() => actions.setIsPainting(false)}
              />
            ) : isBlurring ? (
              <BlurBrushCanvas
                ref={blurCanvasRef}
                imageUrl={selectedImage.url}
                blurAmount={blurAmount}
                blurRadius={blurRadius}
                onBlurAmountChange={actions.setBlurAmount}
                onBlurRadiusChange={actions.setBlurRadius}
                onApply={(dataUrl) => {
                  actions.selectImage({ ...selectedImage, url: dataUrl });
                  actions.setIsBlurring(false);
                  actions.setHasEdited(true);
                }}
                onCancel={() => actions.setIsBlurring(false)}
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
