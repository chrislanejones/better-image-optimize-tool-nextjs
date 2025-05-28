// components/ImageEditorCanvas.tsx
import React from "react";
import { Images, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import CroppingTool from "./cropping-tool";
import BlurBrushCanvas from "./blur-tool";
import PaintTool from "./paint-tool";
import TextTool from "./text-tool";
import { EditorState } from "@/types/types";

interface ImageEditorCanvasProps {
  editorState: EditorState;
  imageUrl: string;
  zoom: number;
  width: number;
  height: number;
  allImages?: any[];
  currentImageId?: string;
  multiCropData: any;
  blurAmount: number;
  blurRadius: number;
  isEraser: boolean;

  // Actions
  onSelectImage?: (image: any) => void;
  onStateChange: (state: EditorState) => void;
  onCropResult: (url: string) => void;
  onBlurResult: (url: string) => void;
  onPaintResult: (url: string) => void;
  onTextResult: (url: string) => void;
  setMultiCropData: (data: any) => void;
  setBold: (bold: boolean) => void;
  setItalic: (italic: boolean) => void;
  setIsEraser: (eraser: boolean) => void;

  // Refs
  cropToolRef: React.RefObject<any>;
  blurCanvasRef: React.RefObject<any>;
  paintToolRef: React.RefObject<any>;
  textToolRef: React.RefObject<any>;
  imgRef: React.RefObject<HTMLImageElement | null>;
}

export const ImageEditorCanvas: React.FC<ImageEditorCanvasProps> = ({
  editorState,
  imageUrl,
  zoom,
  width,
  height,
  allImages,
  currentImageId,
  multiCropData,
  blurAmount,
  blurRadius,
  isEraser,
  onSelectImage,
  onStateChange,
  onCropResult,
  onBlurResult,
  onPaintResult,
  onTextResult,
  setMultiCropData,
  setBold,
  setItalic,
  setIsEraser,
  cropToolRef,
  blurCanvasRef,
  paintToolRef,
  textToolRef,
  imgRef,
}) => {
  // Multi-edit mode layout
  if (editorState === "multiImageEdit") {
    if (!allImages || allImages.length <= 1) {
      return (
        <div className="h-[70vh] bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Images className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              Multi Edit mode requires multiple images
            </p>
            <Button
              onClick={() => onStateChange("resizeAndOptimize")}
              variant="outline"
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Editor
            </Button>
          </div>
        </div>
      );
    }

    const isPortrait = height > width;

    if (isPortrait) {
      return (
        <div className="h-[70vh] bg-gray-900">
          <div className="flex flex-col h-full">
            <div className="flex-1 p-4">
              <div className="h-full rounded-lg overflow-hidden">
                <CroppingTool
                  ref={cropToolRef}
                  imageUrl={imageUrl}
                  onApply={(croppedUrl) => {
                    if (cropToolRef.current) {
                      const cropData = cropToolRef.current.getCrop();
                      setMultiCropData(cropData);
                    }
                  }}
                  onCancel={() => onStateChange("resizeAndOptimize")}
                  className="h-full"
                />
              </div>
            </div>
            <div className="h-32 bg-gray-800 px-4 py-2 overflow-x-auto">
              <div className="flex gap-3 h-full">
                {allImages.map((img: any, index: number) => {
                  if (img.id === currentImageId) return null;
                  return (
                    <div
                      key={img.id}
                      className="relative group cursor-pointer flex-shrink-0"
                      onClick={() => onSelectImage?.(img)}
                    >
                      <div className="h-24 w-24 bg-gray-700 rounded overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <span className="text-xs text-white text-center">
                          Click to
                          <br />
                          edit
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="h-[70vh] bg-gray-900">
          <div className="flex h-full">
            <div className="flex-1 p-4">
              <div className="h-full rounded-lg overflow-hidden">
                <CroppingTool
                  ref={cropToolRef}
                  imageUrl={imageUrl}
                  onApply={(croppedUrl) => {
                    if (cropToolRef.current) {
                      const cropData = cropToolRef.current.getCrop();
                      setMultiCropData(cropData);
                    }
                  }}
                  onCancel={() => onStateChange("resizeAndOptimize")}
                  className="h-full"
                />
              </div>
            </div>
            <div className="w-1/4 bg-gray-800 p-4 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Other Images (Preview)
              </h3>
              <div className="space-y-3">
                {allImages.map((img: any, index: number) => {
                  if (img.id === currentImageId) return null;
                  return (
                    <div
                      key={img.id}
                      className="relative group cursor-pointer"
                      onClick={() => onSelectImage?.(img)}
                    >
                      <div className="aspect-video bg-gray-700 rounded overflow-hidden">
                        <img
                          src={img.url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                        <span className="text-xs text-white">
                          Click to edit
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {img.file.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Tool-specific rendering
  switch (editorState) {
    case "crop":
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <CroppingTool
              ref={cropToolRef}
              imageUrl={imageUrl}
              onApply={onCropResult}
              onCancel={() => onStateChange("editImage")}
            />
          </div>
        </div>
      );

    case "blur":
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <BlurBrushCanvas
              ref={blurCanvasRef}
              imageUrl={imageUrl}
              blurAmount={blurAmount}
              blurRadius={blurRadius}
              zoom={zoom}
              onApply={onBlurResult}
              onCancel={() => onStateChange("editImage")}
              onBlurAmountChange={() => {}}
              onBlurRadiusChange={() => {}}
            />
          </div>
        </div>
      );

    case "paint":
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <PaintTool
              ref={paintToolRef}
              imageUrl={imageUrl}
              onApplyPaint={onPaintResult}
              onCancel={() => onStateChange("editImage")}
              onToggleEraser={() => setIsEraser(!isEraser)}
              isEraser={isEraser}
            />
          </div>
        </div>
      );

    case "text":
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <TextTool
              ref={textToolRef}
              imageUrl={imageUrl}
              onApplyText={onTextResult}
              onCancel={() => onStateChange("editImage")}
              setEditorState={(state: string) =>
                onStateChange(state as EditorState)
              }
              setBold={setBold}
              setItalic={setItalic}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <div
              className="overflow-auto"
              style={{
                maxHeight: "700px",
                height: "70vh",
              }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Edited image"
                className="max-w-full transform origin-top-left"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          </div>
        </div>
      );
  }
};
