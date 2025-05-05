// store/hooks/useImageStats.ts
import { useCallback, useEffect } from "react";
import { useImageStore, useImageActions } from "../useImageStore";

export const useImageStats = () => {
  const { selectedImage, originalStats, newStats, dataSavings, format } =
    useImageStore();
  const actions = useImageActions();

  // Initialize stats when new image is selected
  useEffect(() => {
    if (selectedImage && !originalStats) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        actions.setOriginalStats({
          width: img.width,
          height: img.height,
          size: selectedImage.file.size,
          format: selectedImage.file.type.split("/")[1] || "unknown",
        });
      };
      img.src = selectedImage.url;
    }
  }, [selectedImage, originalStats, actions]);

  // Update stats after image processing
  const updateStatsAfterProcessing = useCallback(
    async (imageUrl: string) => {
      try {
        const blob = await fetch(imageUrl).then((r) => r.blob());
        const img = new Image();
        img.src = imageUrl;

        await new Promise<void>((resolve) => {
          img.onload = () => {
            const newStatsObj = {
              width: img.naturalWidth,
              height: img.naturalHeight,
              size: blob.size,
              format: format,
            };
            actions.setNewStats(newStatsObj);

            if (originalStats) {
              const savings = calculateSizeReduction(
                originalStats.size,
                blob.size
              );
              actions.setDataSavings(savings);
            }

            resolve();
          };
        });
      } catch (error) {
        console.error("Error updating stats:", error);
      }
    },
    [format, originalStats, actions]
  );

  // Calculate size reduction percentage
  const calculateSizeReduction = (
    originalSize: number,
    newSize: number
  ): number => {
    if (originalSize <= 0) return 0;
    return 100 - (newSize / originalSize) * 100;
  };

  // Format bytes to human readable string
  const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Get formatted stats for display
  const getFormattedStats = useCallback(() => {
    if (!originalStats) return null;

    return {
      original: {
        dimensions: `${originalStats.width} × ${originalStats.height}`,
        size: formatBytes(originalStats.size),
        format: originalStats.format.toUpperCase(),
      },
      edited: newStats
        ? {
            dimensions: `${newStats.width} × ${newStats.height}`,
            size: formatBytes(newStats.size),
            format: newStats.format.toUpperCase(),
          }
        : null,
      savings: {
        percentage: Math.round(dataSavings),
        bytes:
          originalStats && newStats
            ? formatBytes(originalStats.size - newStats.size)
            : "0 Bytes",
      },
    };
  }, [originalStats, newStats, dataSavings]);

  return {
    originalStats,
    newStats,
    dataSavings,
    updateStatsAfterProcessing,
    getFormattedStats,
    formatBytes,
    calculateSizeReduction,
  };
};

// Add a simple history hook for undo/redo functionality
import { create } from "zustand";

interface HistoryEntry {
  id: string;
  imageUrl: string;
  action: string;
  timestamp: number;
}

interface HistoryState {
  history: HistoryEntry[];
  currentIndex: number;
  maxHistory: number;
  addHistoryEntry: (entry: Omit<HistoryEntry, "timestamp">) => void;
  undo: () => string | null;
  redo: () => string | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
}

export const useImageHistory = create<HistoryState>((set, get) => ({
  history: [],
  currentIndex: -1,
  maxHistory: 10,

  addHistoryEntry: (entry) =>
    set((state) => {
      const newEntry: HistoryEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      // Remove future entries if we're not at the end
      const newHistory = state.history.slice(0, state.currentIndex + 1);

      // Add new entry
      newHistory.push(newEntry);

      // Keep only maxHistory entries
      if (newHistory.length > state.maxHistory) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        currentIndex: newHistory.length - 1,
      };
    }),

  undo: () => {
    const state = get();
    if (state.canUndo()) {
      const prevIndex = state.currentIndex - 1;
      set({ currentIndex: prevIndex });
      return state.history[prevIndex].imageUrl;
    }
    return null;
  },

  redo: () => {
    const state = get();
    if (state.canRedo()) {
      const nextIndex = state.currentIndex + 1;
      set({ currentIndex: nextIndex });
      return state.history[nextIndex].imageUrl;
    }
    return null;
  },

  canUndo: () => {
    const state = get();
    return state.currentIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.currentIndex < state.history.length - 1;
  },

  clearHistory: () =>
    set({
      history: [],
      currentIndex: -1,
    }),
}));

// Enhanced useImageHistory hook with Zustand integration
export const useImageHistoryWithStore = () => {
  const history = useImageHistory();
  const { selectedImage } = useImageStore();
  const actions = useImageActions();

  const saveState = useCallback(
    (action: string) => {
      if (!selectedImage) return;

      history.addHistoryEntry({
        id: selectedImage.id,
        imageUrl: selectedImage.url,
        action,
      });
    },
    [selectedImage, history]
  );

  const performUndo = useCallback(() => {
    const prevUrl = history.undo();
    if (prevUrl && selectedImage) {
      actions.selectImage({
        ...selectedImage,
        url: prevUrl,
      });
    }
  }, [history, selectedImage, actions]);

  const performRedo = useCallback(() => {
    const nextUrl = history.redo();
    if (nextUrl && selectedImage) {
      actions.selectImage({
        ...selectedImage,
        url: nextUrl,
      });
    }
  }, [history, selectedImage, actions]);

  return {
    saveState,
    performUndo,
    performRedo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    clearHistory: history.clearHistory,
  };
};
