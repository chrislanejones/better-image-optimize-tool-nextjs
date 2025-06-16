import React, { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useImageEditor } from "./hooks/useImageEditor";
import { ImageEditorToolbar } from "./components/image-editor-toolbar";
import ImageEditorCanvas from "./components/image-editor-canvas";
import { RotationControls } from "./components/rotation-controls";
import BulkImageEditor from "./bulk-image-editor";
import ImageResizer from "./components/image-resizer";
import ImageStats from "./components/image-stats";
import ImageZoomView from "./components/image-zoom-view";
import { rotateImage } from "./utils/image-processing";
import type {
  CroppingToolRef,
  ImageEditorProps,
  ExtendedImageEditorProps,
  EditorState,
} from "@/types/types";

export default function ImageEditor({
  imageUrl,
  onImageChange,
  onDownload,
  onClose,
  className,
  fileName = "image.png",
  fileType = "image/png",
  fileSize = 0,
  currentPage = 1,
  totalPages = 1,
  onNavigateImage,
  onRemoveAll,
  onUploadNew,
  allImages = [],
  currentImageId = "",
  onSelectImage,
  onEditModeChange,
}: ExtendedImageEditorProps) {
  const { toast } = useToast();

  // Refs
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropToolRef = useRef<CroppingToolRef>(null);
  const blurCanvasRef = useRef<any>(null);
  const paintToolRef = useRef<any>(null);
  const textToolRef = useRef<any>(null);

  // Use the custom hook for state management
  const editor = useImageEditor({
    imageUrl,
    fileSize,
    fileType,
    format: fileType.split("/")[1] || "webp",
    onImageChange,
    onEditModeChange,
  });

  // Handle bulk image editor selection - only allow in non-bulk modes
  const handleBulkImageSelect = useCallback(
    (imageId: string) => {
      // Only allow image selection when NOT in bulk edit modes
      if (editor.editorState === "resizeAndOptimize") {
        const selectedImage = allImages.find((img) => img.id === imageId);
        if (selectedImage && onSelectImage) {
          onSelectImage(selectedImage);
        }
      }
    },
    [allImages, onSelectImage, editor.editorState]
  );

  // Tool callbacks (keeping existing implementations)
  const handleApplyCrop = useCallback(() => {
    if (cropToolRef.current) {
      cropToolRef.current.applyCrop();
    }
  }, []);

  const handleCropResult = useCallback(
    (croppedImageUrl: string) => {
      if (!croppedImageUrl) return;

      const img = new Image();
      img.src = croppedImageUrl;

      img.onload = async () => {
        editor.setWidth(img.width);
        editor.setHeight(img.height);

        const estimatedSize = editor.originalStats
          ? Math.round(
              ((img.width * img.height) /
                (editor.originalStats.width * editor.originalStats.height)) *
                editor.originalStats.size
            )
          : 0;

        editor.setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: editor.format,
        });

        if (editor.originalStats) {
          const savings =
            100 - (estimatedSize / editor.originalStats.size) * 100;
          editor.setDataSavings(savings);
        }

        editor.setHasEdited(true);
        editor.setFlipVertical(!editor.flipVertical);
        editor.setFlipHorizontal(!editor.flipHorizontal);
        editor.setEditorState("editImage");
        editor.addToHistory(croppedImageUrl);

        if (onImageChange) {
          onImageChange(croppedImageUrl);
        }
      };
    },
    [editor, onImageChange]
  );

  const handleApplyBlur = useCallback(() => {
    if (blurCanvasRef.current) {
      const dataUrl = blurCanvasRef.current.getCanvasDataUrl();
      if (dataUrl) handleBlurResult(dataUrl);
    }
  }, []);

  const handleBlurResult = useCallback(
    (blurredImageUrl: string) => {
      if (!blurredImageUrl) return;

      const img = new Image();
      img.src = blurredImageUrl;

      img.onload = async () => {
        editor.setWidth(img.width);
        editor.setHeight(img.height);

        const estimatedSize = editor.originalStats
          ? Math.round(editor.originalStats.size * 0.9)
          : 0;

        editor.setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: editor.format,
        });

        if (editor.originalStats) {
          const savings =
            100 - (estimatedSize / editor.originalStats.size) * 100;
          editor.setDataSavings(savings);
        }

        editor.setHasEdited(true);
        editor.setEditorState("editImage");
        editor.addToHistory(blurredImageUrl);

        if (onImageChange) {
          onImageChange(blurredImageUrl);
        }
      };
    },
    [editor, onImageChange]
  );

  const handleApplyPaint = useCallback(() => {
    if (paintToolRef.current) {
      const dataUrl = paintToolRef.current.getCanvasDataUrl();
      if (dataUrl) handlePaintResult(dataUrl);
    }
  }, []);

  const handlePaintResult = useCallback(
    (paintedImageUrl: string) => {
      if (!paintedImageUrl) return;

      const img = new Image();
      img.src = paintedImageUrl;

      img.onload = async () => {
        editor.setWidth(img.width);
        editor.setHeight(img.height);

        const estimatedSize = editor.originalStats
          ? Math.round(editor.originalStats.size * 1.05)
          : 0;

        editor.setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: editor.format,
        });

        if (editor.originalStats) {
          const savings =
            100 - (estimatedSize / editor.originalStats.size) * 100;
          editor.setDataSavings(savings);
        }

        editor.setHasEdited(true);
        editor.setEditorState("editImage");
        editor.addToHistory(paintedImageUrl);

        if (onImageChange) {
          onImageChange(paintedImageUrl);
        }
      };
    },
    [editor, onImageChange]
  );

  const handleApplyText = useCallback(() => {
    if (textToolRef.current) {
      textToolRef.current.applyText();
    }
  }, []);

  const handleTextResult = useCallback(
    (textedImageUrl: string) => {
      if (!textedImageUrl) return;

      const img = new Image();
      img.src = textedImageUrl;

      img.onload = async () => {
        editor.setWidth(img.width);
        editor.setHeight(img.height);

        const estimatedSize = editor.originalStats
          ? Math.round(editor.originalStats.size * 1.02)
          : 0;

        editor.setNewStats({
          width: img.width,
          height: img.height,
          size: estimatedSize,
          format: editor.format,
        });

        if (editor.originalStats) {
          const savings =
            100 - (estimatedSize / editor.originalStats.size) * 100;
          editor.setDataSavings(savings);
        }

        editor.setHasEdited(true);
        editor.setEditorState("editImage");
        editor.addToHistory(textedImageUrl);

        if (onImageChange) {
          onImageChange(textedImageUrl);
        }
      };
    },
    [editor, onImageChange]
  );

  // Rotation handlers (keeping existing implementations)
  const handleRotate = useCallback(
    async (degrees: number) => {
      try {
        const rotatedUrl = await rotateImage(
          imageUrl,
          degrees,
          editor.format,
          editor.quality
        );

        const img = new Image();
        img.onload = () => {
          editor.setWidth(img.naturalWidth);
          editor.setHeight(img.naturalHeight);
          editor.addToHistory(rotatedUrl);

          if (onImageChange) {
            onImageChange(rotatedUrl);
          }

          editor.setHasEdited(true);

          if (editor.originalStats) {
            editor.setNewStats({
              width: img.naturalWidth,
              height: img.naturalHeight,
              size: editor.originalStats.size,
              format: editor.format,
            });
          }
          editor.setEditorState("editImage");
        };
        img.src = rotatedUrl;
      } catch (error) {
        console.error("Error rotating image:", error);
        toast({
          title: "Failed to rotate image",
          variant: "destructive",
        });
      }
    },
    [imageUrl, editor, onImageChange, toast]
  );

  const handleFlipHorizontal = useCallback(async () => {
    try {
      const { flipImage } = await import("./utils/image-processing");
      const flippedUrl = await flipImage(
        imageUrl,
        true,
        editor.format,
        editor.quality
      );

      editor.addToHistory(flippedUrl);
      if (onImageChange) {
        onImageChange(flippedUrl);
      }

      editor.setHasEdited(true);
    } catch (error) {
      console.error("Error flipping image:", error);
      toast({
        title: "Failed to flip image",
        variant: "destructive",
      });
    }
  }, [imageUrl, editor, onImageChange, toast]);

  const handleFlipVertical = useCallback(async () => {
    try {
      const { flipImage } = await import("./utils/image-processing");
      const flippedUrl = await flipImage(
        imageUrl,
        false,
        editor.format,
        editor.quality
      );

      editor.addToHistory(flippedUrl);
      if (onImageChange) {
        onImageChange(flippedUrl);
      }

      editor.setHasEdited(true);
    } catch (error) {
      console.error("Error flipping image:", error);
      toast({
        title: "Failed to flip image",
        variant: "destructive",
      });
    }
  }, [imageUrl, editor, onImageChange, toast]);

  const handleRotateClockwise = useCallback(() => {
    const newRotation = (editor.rotation + 90) % 360;
    handleRotate(newRotation);
  }, [editor.rotation, handleRotate]);

  const handleRotateCounterClockwise = useCallback(() => {
    const newRotation = (editor.rotation - 90 + 360) % 360;
    handleRotate(newRotation);
  }, [editor.rotation, handleRotate]);

  const handleBulkCropApply = useCallback(() => {
    toast({
      title: "Bulk Crop Applied",
      description: `Crop applied to all ${allImages.length} images!`,
      variant: "default",
    });
    editor.setEditorState("bulkImageEdit");
  }, [allImages.length, toast, editor]);

  const handleDownload = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      canvas.width = imgRef.current.naturalWidth;
      canvas.height = imgRef.current.naturalHeight;
      ctx.drawImage(imgRef.current, 0, 0);

      const extension =
        editor.format === "webp"
          ? "webp"
          : editor.format === "png"
          ? "png"
          : "jpg";
      const normalizedQuality = editor.quality / 100;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Failed to create blob");
          }

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const fileNameWithoutExt = fileName.split(".")[0] || "image";
          a.download = `${fileNameWithoutExt}-edited.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          toast({
            title: `Download complete! File saved as ${editor.format.toUpperCase()}, ${(
              blob.size / 1024
            ).toFixed(0)} KB`,
            variant: "default",
          });

          if (onDownload) {
            onDownload();
          }
        },
        getMimeType(editor.format),
        normalizedQuality
      );
    } catch (error) {
      console.error("Error downloading image:", error);

      toast({
        title:
          "Download error. Failed to download the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [editor, fileName, onDownload, toast]);

  // Render different components based on editor state
  if (
    editor.editorState === "bulkImageEdit" ||
    editor.editorState === "bulkCrop"
  ) {
    return (
      <div className={`flex flex-col gap-6 ${className}`}>
        <BulkImageEditor
          editorState={editor.editorState}
          images={allImages}
          selectedImageId={currentImageId}
          onSelectImage={handleBulkImageSelect} // This will be disabled in bulk mode
          onStateChange={editor.setEditorState}
          onNavigateImage={onNavigateImage}
          onClose={onClose}
          onRemoveAll={onRemoveAll}
          onUploadNew={onUploadNew}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <ImageEditorToolbar
        editorState={editor.editorState}
        isCompressing={editor.isCompressing}
        zoom={editor.zoom}
        historyIndex={editor.historyIndex}
        historyLength={editor.history.length}
        currentPage={currentPage}
        totalPages={totalPages}
        padlockAnimation={editor.padlockAnimation}
        bulkCropData={editor.bulkCropData}
        blurAmount={editor.blurAmount}
        blurRadius={editor.blurRadius}
        allImages={allImages}
        onZoomIn={editor.handleZoomIn}
        onZoomOut={editor.handleZoomOut}
        onUndo={editor.handleUndo}
        onRedo={editor.handleRedo}
        onRotateLeft={handleRotateCounterClockwise}
        onRotateRight={handleRotateClockwise}
        onFlipHorizontal={handleFlipHorizontal}
        onFlipVertical={handleFlipVertical}
        onReset={editor.handleReset}
        onClose={onClose}
        onRemoveAll={onRemoveAll}
        onUploadNew={onUploadNew}
        onNavigateImage={onNavigateImage}
        onStateChange={editor.setEditorState}
        onApplyCrop={handleApplyCrop}
        onApplyBlur={handleApplyBlur}
        onApplyPaint={handleApplyPaint}
        onApplyText={handleApplyText}
        onBlurAmountChange={editor.setBlurAmount}
        onBlurRadiusChange={editor.setBlurRadius}
        onBulkCropApply={handleBulkCropApply}
        onExitEditMode={() => {
          editor.setEditorState("resizeAndOptimize");
          if (onEditModeChange) onEditModeChange(false);
        }}
      />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <section
            className={`${
              editor.editorState !== "resizeAndOptimize"
                ? "col-span-full"
                : "md:col-span-3"
            }`}
          >
            <ImageEditorCanvas
              editorState={editor.editorState}
              isBulkMode={false}
              imageUrl={imageUrl}
              zoom={editor.zoom}
              width={editor.width}
              height={editor.height}
              allImages={allImages}
              currentImageId={currentImageId}
              bulkCropData={editor.bulkCropData}
              onSelectImage={onSelectImage}
              onStateChange={editor.setEditorState}
              onCropResult={handleCropResult}
              onBlurResult={handleBlurResult}
              onPaintResult={handlePaintResult}
              onTextResult={handleTextResult}
              setMultiCropData={editor.setBulkCropData}
              setBold={editor.setIsBold}
              setItalic={editor.setIsItalic}
              blurAmount={editor.blurAmount}
              blurRadius={editor.blurRadius}
              isEraser={editor.isEraser}
              setIsEraser={editor.setIsEraser}
              cropToolRef={cropToolRef}
              blurCanvasRef={blurCanvasRef}
              paintToolRef={paintToolRef}
              textToolRef={textToolRef}
              imgRef={imgRef}
            />
          </section>

          {editor.editorState === "resizeAndOptimize" && (
            <aside className="md:col-span-1 space-y-6">
              <ImageResizer
                width={editor.width}
                height={editor.height}
                maxWidth={editor.originalStats?.width || 1000}
                maxHeight={editor.originalStats?.height || 1000}
                onResize={editor.handleResize}
                onReset={editor.handleReset}
                onApplyResize={editor.handleApplyResize}
                format={editor.format}
                onFormatChange={editor.handleFormatChange}
                onDownload={handleDownload}
                isCompressing={editor.isCompressing}
                quality={editor.quality}
                onQualityChange={editor.handleQualityChange}
                compressionLevel={editor.compressionLevel}
                onCompressionLevelChange={editor.setCompressionLevel}
                currentPage={currentPage}
                totalPages={totalPages}
                onNavigateImage={onNavigateImage}
              />

              {editor.hasEdited && <ImageZoomView imageUrl={imageUrl} />}
            </aside>
          )}
        </div>

        {editor.editorState === "editImage" && (
          <RotationControls
            onRotate={handleRotate}
            onFlipHorizontal={handleFlipHorizontal}
            onFlipVertical={handleFlipVertical}
            onReset={() => {
              editor.setRotation(0);
              editor.setFlipHorizontal(false);
              editor.setFlipVertical(false);
            }}
            currentRotation={editor.rotation}
          />
        )}

        {editor.editorState === "resizeAndOptimize" && editor.originalStats && (
          <ImageStats
            originalStats={editor.originalStats}
            newStats={editor.newStats}
            dataSavings={editor.dataSavings}
            hasEdited={editor.hasEdited}
            fileName={fileName}
            format={editor.format}
            fileType={fileType}
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
} // ← closes export default function ImageEditor

// Now, outside the component, define your helper:

function getMimeType(format: string): string {
  if (format === "webp") return "image/webp";
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  return "application/octet-stream";
}
