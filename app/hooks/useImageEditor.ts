// app/hooks/useImageEditor.ts
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { compressImageAggressively } from "@/app/utils/image-processing";
import {
  FILE_LIMITS,
  COMPRESSION_LEVELS,
  CORE_WEB_VITALS,
} from "@/app/constants/editorConstants";
import type { EditorState, CoreWebVitalsScore, ImageFile } from "@/types/types";

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
  const { toast } = useToast();

  // Editor state
  const [editorState, setEditorState] =
    useState<EditorState>("resizeAndOptimize");
  const [zoom, setZoom] = useState(1);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Tool & format state
  const [format, setFormat] = useState(initialFormat || "webp");
  const [quality, setQuality] = useState(85);
  const [compressionLevel, setCompressionLevel] = useState("medium");

  // Image stats
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [originalStats, setOriginalStats] = useState<any>(null);
  const [newStats, setNewStats] = useState<any>(null);
  const [dataSavings, setDataSavings] = useState(0);
  const [hasEdited, setHasEdited] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Core Web Vitals preview
  const [coreWebVitalsScore, setCoreWebVitalsScore] =
    useState<CoreWebVitalsScore>("good");

  // History
  const [history, setHistory] = useState<string[]>([imageUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Notify parent of edit mode
  useEffect(() => {
    onEditModeChange?.(
      ["editImage", "bulkImageEdit", "crop", "blur", "paint", "text"].includes(
        editorState
      )
    );
  }, [editorState, onEditModeChange]);

  // Load initial image stats
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
  }, [imageUrl, fileSize, fileType]);

  // Preview Core Web Vitals
  const updateCoreWebVitalsScore = useCallback((w: number, h: number) => {
    const size = w * h;
    const buf = CORE_WEB_VITALS.BUFFER;
    let score: CoreWebVitalsScore = "poor";
    if (size <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD - buf) score = "good";
    else if (size <= CORE_WEB_VITALS.LCP_THRESHOLD_GOOD + buf)
      score = "almost-there";
    else if (size <= CORE_WEB_VITALS.LCP_THRESHOLD_POOR - buf)
      score = "needs-improvement";
    setCoreWebVitalsScore(score);
  }, []);

  // Preview resize (slider)
  const handleResize = useCallback(
    (newW: number, newH: number) => {
      setWidth(newW);
      setHeight(newH);
      if (originalStats) {
        const est = Math.round(
          ((newW * newH) / (originalStats.width * originalStats.height)) *
            originalStats.size
        );
        setNewStats({ width: newW, height: newH, size: est, format });
        setDataSavings(100 - (est / originalStats.size) * 100);
        setHasEdited(true);
      }
      updateCoreWebVitalsScore(newW, newH);
    },
    [originalStats, format, updateCoreWebVitalsScore]
  );

  // Add to history
  const addToHistory = useCallback(
    (url: string) => {
      setHistory((h) => [...h.slice(0, historyIndex + 1), url]);
      setHistoryIndex((i) => i + 1);
    },
    [historyIndex]
  );

  // Apply resize/compress
  const handleApplyResize = useCallback(async () => {
    if (!originalStats) return;
    setIsCompressing(true);
    let prog = 0;
    const timer = setInterval(() => {
      prog = Math.min(95, prog + 5);
      setCompressionProgress(prog);
    }, 100);

    try {
      const {
        url,
        blob,
        width: w,
        height: h,
      } = await compressImageAggressively(
        imageUrl,
        width,
        format,
        FILE_LIMITS.targetCompressionSize,
        compressionLevel
      );
      clearInterval(timer);
      setCompressionProgress(100);
      setIsCompressing(false);

      setWidth(w);
      setHeight(h);
      onImageChange?.(url);

      const savings = 100 - (blob.size / originalStats.size) * 100;
      setNewStats({ width: w, height: h, size: blob.size, format });
      setDataSavings(savings);
      setHasEdited(true);
      setShowStats(true);

      addToHistory(url);

      toast({
        title: `Converted: -${Math.round(savings)}%`,
        variant: "default",
      });
    } catch {
      clearInterval(timer);
      setIsCompressing(false);
      setCompressionProgress(0);
      toast({ title: "Conversion failed", variant: "destructive" });
    }
  }, [
    imageUrl,
    width,
    format,
    compressionLevel,
    originalStats,
    onImageChange,
    historyIndex,
    addToHistory,
    toast,
  ]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const ni = historyIndex - 1;
    setHistoryIndex(ni);
    onImageChange?.(history[ni]);
  }, [history, historyIndex, onImageChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const ni = historyIndex + 1;
    setHistoryIndex(ni);
    onImageChange?.(history[ni]);
  }, [history, historyIndex, onImageChange]);

  // Reset
  const handleReset = useCallback(() => {
    if (!originalStats) return;
    setWidth(originalStats.width);
    setHeight(originalStats.height);
    setFormat(initialFormat);
    setQuality(85);
    setCompressionLevel("medium");
    setHasEdited(false);
    setShowStats(false);
    setNewStats(null);
    setDataSavings(0);
    onImageChange?.(imageUrl);
    setHistory([imageUrl]);
    setHistoryIndex(0);
  }, [originalStats, initialFormat, imageUrl, onImageChange]);

  return {
    // state
    editorState,
    zoom,
    isCompressing,
    compressionProgress,
    width,
    height,
    originalStats,
    newStats,
    dataSavings,
    hasEdited,
    showStats,
    format,
    quality,
    compressionLevel,
    coreWebVitalsScore,
    history,
    historyIndex,

    // setters
    setEditorState,
    setZoom,
    setFormat,
    setQuality,
    setCompressionLevel,
    setWidth,
    setHeight,
    setNewStats,
    setDataSavings,
    setHasEdited,
    setShowStats,

    // actions
    handleResize,
    handleApplyResize,
    handleUndo,
    handleRedo,
    handleReset,
    updateCoreWebVitalsScore,
    addToHistory,
  };
};
