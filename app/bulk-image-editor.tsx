"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Minus,
  Plus,
  Crop as CropIcon,
  Type,
  X,
  Check,
  Download,
} from "lucide-react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { downloadBulkCroppedImages } from "@/app/utils/image-utils";
import type { BulkImageEditorProps } from "@/types/types";

export default function BulkImageEditor({
  editorState,
  images,
  selectedImageId,
  onStateChange,
  className = "",
}: BulkImageEditorProps) {
  const { toast } = useToast();
  const isBulkCropping = editorState === "bulkCrop";
  const [padlockAnim, setPadlockAnim] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>("");
  const [processingProgress, setProcessingProgress] = useState<number | null>(
    null
  );

  const selected = images.find((i) => i.id === selectedImageId);
  if (!selected) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        No image selected
      </div>
    );
  }
  const others = images.filter((i) => i.id !== selectedImageId);

  useEffect(() => {
    setPadlockAnim(true);
    const t = setTimeout(() => setPadlockAnim(false), 600);
    return () => clearTimeout(t);
  }, [editorState]);

  const handleZoomOut = useCallback(
    () => setZoom((z) => Math.max(z - 0.1, 0.5)),
    []
  );
  const handleZoomIn = useCallback(
    () => setZoom((z) => Math.min(z + 0.1, 3)),
    []
  );

  const enterCrop = () => {
    setHasApplied(false);
    onStateChange("bulkCrop");
    toast({ title: "Bulk Crop Mode", variant: "default" });
  };
  const cancelCrop = () => onStateChange("bulkImageEdit");

  const applyCrop = async () => {
    if (!completedCrop) {
      toast({ title: "No crop area", variant: "destructive" });
      return;
    }

    setProcessingStage("Cropping images…");
    setProcessingProgress(0);

    await downloadBulkCroppedImages(
      images.map((i) => i.url),
      crop,
      "jpeg",
      0.9,
      `bulk-${Date.now()}.zip`,
      (pct, cur, tot, stage) => {
        setProcessingStage(stage);
        setProcessingProgress(pct);
      }
    );

    setHasApplied(true);
    setProcessingStage("");
    setProcessingProgress(null);
    onStateChange("bulkImageEdit");
    toast({ title: "Download ready", variant: "default" });
  };
  const downloadAll = () => applyCrop();

  const getGridPos = (idx: number) => {
    const perRow = 3,
      rows = 3;
    if (idx < perRow * rows) {
      const r = Math.floor(idx / perRow),
        c = idx % perRow;
      return { gridRow: r + 1, gridColumn: c + 4 };
    }
    const ex = idx - perRow * rows,
      r2 = Math.floor(ex / 6) + rows + 1,
      c2 = (ex % 6) + 1;
    return { gridRow: r2, gridColumn: c2 };
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Bulk Mode Header */}
      <div
        className={`w-full flex justify-center items-center mb-4 p-2 ${
          padlockAnim ? "animate-pulse" : ""
        }`}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-600 border border-gray-500">
          <Lock className="h-4 w-4 text-white" />
          <span className="font-medium text-white">
            {isBulkCropping ? "Bulk Crop Mode" : "Bulk Edit Mode"}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomOut}
            title="Zoom Out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleZoomIn}
            title="Zoom In"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isBulkCropping ? (
            <>
              <Button onClick={enterCrop} variant="outline">
                <CropIcon className="mr-1 h-4 w-4" /> Bulk Crop
              </Button>
              <Button
                onClick={() =>
                  toast({ title: "Coming soon", variant: "default" })
                }
                variant="outline"
                disabled
              >
                <Type className="mr-1 h-4 w-4" /> Bulk Text
              </Button>
              {hasApplied && (
                <Button
                  onClick={downloadAll}
                  variant="default"
                  className="border-black text-black hover:bg-black/10"
                >
                  <Download className="mr-1 h-4 w-4" /> Download All
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                onClick={applyCrop}
                variant="default"
                disabled={!completedCrop || processingProgress !== null}
              >
                {processingProgress !== null ? (
                  `${processingStage} ${processingProgress}%`
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Apply Crop
                  </>
                )}
              </Button>
              <Button onClick={cancelCrop} variant="outline">
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </>
          )}
        </div>

        {!isBulkCropping && (
          <Button
            onClick={() => onStateChange("resizeAndOptimize")}
            variant="outline"
          >
            <X className="mr-1 h-4 w-4" /> Exit Bulk Edit Mode
          </Button>
        )}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-6 gap-2">
        <div className="col-span-3 row-span-3 border bg-gray-900 flex items-center justify-center">
          {isBulkCropping ? (
            <ReactCrop
              crop={crop}
              onChange={setCrop}
              onComplete={setCompletedCrop}
            >
              <img src={selected.url} style={{ transform: `scale(${zoom})` }} />
            </ReactCrop>
          ) : (
            <img src={selected.url} style={{ transform: `scale(${zoom})` }} />
          )}
        </div>

        {others.map((o, i) => {
          const pos = getGridPos(i);
          return (
            <div key={o.id} className="aspect-square border" style={pos}>
              <CropPreview url={o.url} crop={crop} isMask={isBulkCropping} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// CropPreview: shows a shaded mask outside `crop` when `isMask` is true
function CropPreview({
  url,
  crop,
  isMask,
}: {
  url: string;
  crop: Crop;
  isMask: boolean;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-800">
      <img src={url} className="w-full h-full object-cover" />
      {isMask && (
        <>
          <div
            className="absolute inset-x-0 top-0 bg-black/50"
            style={{ height: `${crop.y}%` }}
          />
          <div
            className="absolute inset-x-0 bottom-0 bg-black/50"
            style={{ height: `${100 - crop.y - crop.height}%` }}
          />
          <div
            className="absolute left-0"
            style={{
              top: `${crop.y}%`,
              height: `${crop.height}%`,
              width: `${crop.x}%`,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          />
          <div
            className="absolute right-0"
            style={{
              top: `${crop.y}%`,
              height: `${crop.height}%`,
              width: `${100 - crop.x - crop.width}%`,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          />
        </>
      )}
    </div>
  );
}
