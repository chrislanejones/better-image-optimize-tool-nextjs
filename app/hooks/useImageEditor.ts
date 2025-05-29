// hooks/useImageEditor.ts (updated with fixed stats logic)
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { compressImage, getBlobFromUrl } from "@/app/utils/image-utils";
import type { EditorState, ImageFile } from "@/types/types";

interface UseImageEditorProps {
  imageUrl: string;
  fileSize: number;
  fileType: string;
  format: string;
  onImageChange?: (url: string) => void;
  onEditModeChange?: (isEditMode: boolean) => void;
}

export const useImageEditor = ({
  imageUrl,
  fileSize,
  fileType,
  format: initialFormat,
  onImageChange,
  onEditModeChange,
}: UseImageEditorProps) => {
  // Editor state
  const [editorState, setEditorState] =
    useState<EditorState>("resizeAndOptimize");

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [padlockAnimation, setPadlockAnimation] = useState<boolean>(false);

  // Tool states
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [blurAmount, setBlurAmount] = useState<number>(5);
  const [blurRadius, setBlurRadius] = useState<number>(10);
  const [brushSize, setBrushSize] = useState<number>(10);
  const [brushColor, setBrushColor] = useState<string>("#ff0000");
  const [format, setFormat] = useState<string>(initialFormat || "webp");
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [quality, setQuality] = useState<number>(85);
  const [rotation, setRotation] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [flipVertical, setFlipVertical] = useState<boolean>(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Image stats
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [originalStats, setOriginalStats] = useState<any>(null);
  const [newStats, setNewStats] = useState<any>(null);
  const [dataSavings, setDataSavings] = useState<number>(0);
  const [hasEdited, setHasEdited] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false); // New flag for tracking applied operations

  // History states
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Multi-crop state
  const [bulkCropData, setBulkCropData] = useState<any>(null);

  // Progress state
  const [compressionProgress, setCompressionProgress] = useState<number>(0);

  const { toast } = useToast();

  // Notify parent when edit mode changes
  useEffect(() => {
    if (onEditModeChange) {
      const isInEditMode =
        editorState === "editImage" ||
        editorState === "bulkImageEdit" ||
        editorState === "crop" ||
        editorState === "blur" ||
        editorState === "paint" ||
        editorState === "text";

      onEditModeChange(isInEditMode);
    }
  }, [editorState, onEditModeChange]);

  // Play padlock animation when entering edit mode
  useEffect(() => {
    if (editorState === "editImage" || editorState === "bulkImageEdit") {
      setPadlockAnimation(true);
      const timer = setTimeout(() => {
        setPadlockAnimation(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [editorState]);

  // Initialize image dimensions and stats
  useEffect(() => {
    if (!imageUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: fileSize,
        format: fileType.split("/")[1] || "unknown",
      });
    };
    img.src = imageUrl;

    setIsCompressing(false);
  }, [imageUrl, fileSize, fileType]);

  // Reset editor state when image changes via pagination
  useEffect(() => {
    setZoom(1);
    setIsEraser(false);
    setHistory([imageUrl]);
    setHistoryIndex(0);
    setHasEdited(false);
    setNewStats(null);
    setDataSavings(0);
    setShowStats(false); // Reset applied flag
    setRotation(0);
    setFlipHorizontal(false);
    setFlipVertical(false);
  }, [imageUrl]);

  // Update Core Web Vitals score
  const updateCoreWebVitalsScore = useCallback(() => {
    if (!originalStats) return;

    const originalSize = originalStats.width * originalStats.height;
    const currentSize = width * height;

    let compressionRatio = 1.0;
    if (format === "webp") {
      compressionRatio = 0.65;
    } else if (format === "jpeg") {
      compressionRatio = 1.0;
    } else if (format === "png") {
      compressionRatio = 1.5;
    }

    const qualityFactor = quality / 85;
    compressionRatio *= qualityFactor;

    const estimatedSize = currentSize * compressionRatio;
    const originalFileSize = originalStats.size;
    const estimatedFileSize = (estimatedSize / originalSize) * originalFileSize;

    setNewStats({
      width,
      height,
      size: Math.round(estimatedFileSize),
      format,
    });

    const savings = 100 - (estimatedFileSize / originalFileSize) * 100;
    setDataSavings(savings);
  }, [originalStats, width, height, format, quality]);

  // History management
  const addToHistory = useCallback(
    (url: string) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, url];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevUrl = history[newIndex];

      if (onImageChange && prevUrl) {
        onImageChange(prevUrl);
      }
    }
  }, [history, historyIndex, onImageChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextUrl = history[newIndex];

      if (onImageChange && nextUrl) {
        onImageChange(nextUrl);
      }
    }
  }, [history, historyIndex, onImageChange]);

  // FIXED: Apply resize - only mark as permanently applied after successful completion
  const handleApplyResize = useCallback(async () => {
    if (!originalStats) return;

    try {
      setIsCompressing(true);

      let progress = 0;
      const progressTimer = setInterval(() => {
        progress += 5;
        setCompressionProgress(progress);
        if (progress >= 95) {
          clearInterval(progressTimer);
        }
      }, 100);

      const result = await compressImage(imageUrl, format, quality, width);
      const {
        url: compressedUrl,
        blob,
        width: newWidth,
        height: newHeight,
      } = result;

      setWidth(newWidth);
      setHeight(newHeight);
      setCompressionProgress(100);

      if (onImageChange) {
        onImageChange(compressedUrl);
      }

      const updatedStats = {
        width: newWidth,
        height: newHeight,
        size: blob.size,
        format,
      };

      setNewStats(updatedStats);

      const savings = originalStats
        ? 100 - (blob.size / originalStats.size) * 100
        : 0;
      setDataSavings(savings);
      setHasEdited(true);
      setShowStats(true); // FIXED: Mark as permanently applied after successful completion
      addToHistory(compressedUrl);

      setTimeout(() => {
        setIsCompressing(false);
        setCompressionProgress(0);
        toast({
          title: `Image optimized! Reduced file size by ${Math.round(
            savings
          )}% to ${(blob.size / 1024).toFixed(0)} KB`,
          variant: "default",
        });
      }, 800);
    } catch (error) {
      console.error("Error applying resize:", error);
      setIsCompressing(false);
      setCompressionProgress(0);
      // FIXED: Don't mark as applied if there's an error
      toast({
        title:
          "Compression error. Failed to compress the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [
    width,
    height,
    format,
    quality,
    originalStats,
    imageUrl,
    onImageChange,
    addToHistory,
    toast,
  ]);

  // Handle format change
  const handleFormatChange = useCallback(
    (newFormat: string) => {
      setFormat(newFormat);
      updateCoreWebVitalsScore();
    },
    [updateCoreWebVitalsScore]
  );

  // FIXED: Handle resize - show preview stats during slider changes
  const handleResize = useCallback(
    (newWidth: number, newHeight: number) => {
      setWidth(newWidth);
      setHeight(newHeight);

      // Show preview stats during slider changes
      if (
        originalStats &&
        (newWidth !== originalStats.width || newHeight !== originalStats.height)
      ) {
        const estimatedSize = Math.round(
          ((newWidth * newHeight) /
            (originalStats.width * originalStats.height)) *
            originalStats.size
        );

        setNewStats({
          width: newWidth,
          height: newHeight,
          size: estimatedSize,
          format,
        });

        const savings = 100 - (estimatedSize / originalStats.size) * 100;
        setDataSavings(savings);
        setHasEdited(true); // Show stats during slider changes

        // Don't set showStats to true here - only for preview
      }
    },
    [originalStats, format]
  );

  // Handle quality change
  const handleQualityChange = useCallback(
    (newQuality: number) => {
      setQuality(newQuality);
      updateCoreWebVitalsScore();
    },
    [updateCoreWebVitalsScore]
  );

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  }, []);

  // FIXED: Reset image - reset all flags
  const handleReset = useCallback(() => {
    setHasEdited(false);
    setNewStats(null);
    setDataSavings(0);
    setShowStats(false); // Reset applied flag

    if (originalStats) {
      setWidth(originalStats.width);
      setHeight(originalStats.height);
    }

    setHistory([imageUrl]);
    setHistoryIndex(0);
  }, [originalStats, imageUrl]);

  return {
    // State
    editorState,
    isCompressing,
    zoom,
    padlockAnimation,
    isEraser,
    blurAmount,
    blurRadius,
    brushSize,
    brushColor,
    format,
    isBold,
    isItalic,
    quality,
    rotation,
    flipHorizontal,
    flipVertical,
    width,
    height,
    originalStats,
    newStats,
    dataSavings,
    hasEdited,
    showStats, // Expose the applied flag
    history,
    historyIndex,
    bulkCropData,
    compressionProgress,

    // Setters
    setEditorState,
    setIsCompressing,
    setZoom,
    setPadlockAnimation,
    setIsEraser,
    setBlurAmount,
    setBlurRadius,
    setBrushSize,
    setBrushColor,
    setFormat,
    setIsBold,
    setIsItalic,
    setQuality,
    setRotation,
    setFlipHorizontal,
    setFlipVertical,
    setWidth,
    setHeight,
    setOriginalStats,
    setNewStats,
    setDataSavings,
    setHasEdited,
    setShowStats, // Expose setter for applied flag
    setHistory,
    setHistoryIndex,
    setBulkCropData,
    setCompressionProgress,

    // Actions
    updateCoreWebVitalsScore,
    addToHistory,
    handleUndo,
    handleRedo,
    handleApplyResize,
    handleFormatChange,
    handleResize,
    handleQualityChange,
    handleZoomIn,
    handleZoomOut,
    handleReset,
  };
};
