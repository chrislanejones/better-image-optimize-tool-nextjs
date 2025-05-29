import React, { useRef, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import CroppingTool from "./cropping-tool";
import BlurBrushCanvas from "./blur-tool";
import PaintTool from "./paint-tool";
import TextTool from "./text-tool";
import { getCroppedImg } from "@/app/utils/image-utils";
import {
  EditorState,
  EditorCanvasProps,
  ImageDataItem,
  PaintStroke,
  TextOverlay,
} from "@/types/types";

export const ImageEditorCanvas: React.FC<EditorCanvasProps> = ({
  editorState = "resizeAndOptimize",
  imageUrl,
  zoom = 1,
  width,
  height,
  allImages = [],
  currentImageId = "",
  aspect = 4 / 3,
  rotation = 0,
  showCrop = false,
  onCropChange,
  onZoomChange,
  onCropComplete,
  showPaint = false,
  paintStrokes = [],
  isBlurring = false,
  blurAmount,
  blurRadius,
  blurData,
  textOverlays = [],
  imgRef,
  cropToolRef,
  blurCanvasRef,
  paintToolRef,
  textToolRef,
  onCropResult,
  onBlurResult,
  onPaintResult,
  onTextResult,
  onStateChange,
  setMultiCropData,
  setBold,
  setItalic,
  setIsEraser,
  isEraser,
  isBulkMode = false,
  ...rest
}) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const selectedImage = allImages.find(
    (img: ImageDataItem) => img.id === currentImageId
  );
  const otherImages = allImages.filter(
    (img: ImageDataItem) => img.id !== currentImageId
  );

  const applyBulkCrop = () => {
    console.warn("applyBulkCrop not yet implemented");
  };

  useEffect(() => {
    if (canvasRef.current && imageUrl && !showCrop && !isBulkMode) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new Image();
      img.onload = () => {
        if (ctx) {
          canvasRef.current!.width = img.width;
          canvasRef.current!.height = img.height;
          ctx.clearRect(0, 0, img.width, img.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = imageUrl;
    }
  }, [imageUrl, showCrop, isBulkMode]);

  const renderMainCropper = () => (
    <div className="relative w-full max-w-[90%] aspect-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onZoomChange?.(Math.max(zoom - 0.1, 0.1))}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="lucide lucide-minus h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M5 12h14" />
            </svg>
          </button>
          <button
            onClick={() => onZoomChange?.(zoom + 0.1)}
            className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border h-9 w-9 p-0 hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="lucide lucide-plus h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
          <button
            onClick={applyBulkCrop}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 h-9 rounded-md text-sm font-medium"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="lucide lucide-check mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Apply Crop
          </button>
          <button
            onClick={() => onStateChange?.("editImage")}
            className="inline-flex items-center justify-center gap-2 border px-4 py-2 h-9 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="lucide lucide-x mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </div>
      <Cropper
        image={selectedImage?.url || imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        rotation={rotation}
        onCropChange={(location: { x: number; y: number }) => {
          setCrop((prev) => ({ ...prev, x: location.x, y: location.y }));
        }}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        cropShape="rect"
        showGrid={true}
        objectFit="contain"
      />
    </div>
  );

  const renderMirroredImages = () => (
    <div className="flex flex-wrap gap-2 justify-center w-full max-w-6xl p-4">
      {otherImages.map((img: ImageDataItem) => (
        <div
          key={img.id}
          className="w-[150px] h-[150px] bg-gray-800 rounded overflow-hidden flex items-center justify-center"
        >
          <img
            src={img.url}
            alt="Preview"
            className="object-contain max-h-full max-w-full opacity-50"
          />
        </div>
      ))}
    </div>
  );

  if (isBulkMode) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="w-full flex justify-center items-center mb-4">
          <div className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-full bg-gray-600 border border-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="lucide lucide-images h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M18 22H4a2 2 0 0 1-2-2V6" />
              <path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18" />
              <circle cx="12" cy="8" r="2" />
              <rect width="16" height="16" x="6" y="2" rx="2" />
            </svg>
            <span className="font-medium text-white">Bulk Edit Mode</span>
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          {renderMainCropper()}
          {renderMirroredImages()}
        </div>
      </div>
    );
  }

  switch (editorState) {
    case "crop":
      return (
        <div className="space-y-2">
          <div className="relative border rounded-lg overflow-hidden">
            <CroppingTool
              ref={cropToolRef}
              imageUrl={imageUrl}
              onApply={onCropResult || (() => {})}
              onCancel={() => onStateChange?.("editImage")}
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
              blurAmount={blurAmount || 5}
              blurRadius={blurRadius || 10}
              zoom={zoom}
              onApply={onBlurResult || (() => {})}
              onCancel={() => onStateChange?.("editImage")}
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
              onApplyPaint={onPaintResult || (() => {})}
              onCancel={() => onStateChange?.("editImage")}
              onToggleEraser={() => setIsEraser?.(!isEraser)}
              isEraser={isEraser || false}
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
              onApplyText={onTextResult || (() => {})}
              onCancel={() => onStateChange?.("editImage")}
              setEditorState={(state: string) =>
                onStateChange?.(state as EditorState)
              }
              setBold={setBold || (() => {})}
              setItalic={setItalic || (() => {})}
            />
          </div>
        </div>
      );
    default:
      return (
        <div className="relative w-full aspect-auto">
          {showCrop ? (
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              rotation={rotation}
              onCropChange={(location: { x: number; y: number }) => {
                setCrop((prev) => ({ ...prev, x: location.x, y: location.y }));
              }}
              onCropComplete={(_, croppedArea) =>
                setCroppedAreaPixels(croppedArea)
              }
              onZoomChange={onZoomChange}
              cropShape="rect"
              showGrid={true}
              objectFit="contain"
            />
          ) : (
            <>
              <canvas ref={canvasRef} className="w-full h-full hidden" />
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Edited image"
                className="max-w-full transform origin-top-left"
                style={{ transform: `scale(${zoom})` }}
              />
              {showPaint && (
                <div className="absolute inset-0 pointer-events-none">
                  {paintStrokes.map((stroke: PaintStroke, index: number) => (
                    <div key={index} className="paint-stroke"></div>
                  ))}
                </div>
              )}
              {textOverlays.map((overlay: TextOverlay, index: number) => (
                <div
                  key={index}
                  className="absolute pointer-events-none"
                  style={{
                    left: overlay.x,
                    top: overlay.y,
                    fontSize: overlay.fontSize,
                    color: overlay.color,
                    fontWeight: overlay.bold ? "bold" : "normal",
                    fontStyle: overlay.italic ? "italic" : "normal",
                  }}
                >
                  {overlay.text}
                </div>
              ))}
            </>
          )}
        </div>
      );
  }
};

export default ImageEditorCanvas;
