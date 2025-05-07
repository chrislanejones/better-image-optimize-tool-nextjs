// store/hooks/useImageStats.ts
import { useCallback, useEffect, useMemo } from "react";
import { useImageStore } from "../useImageStore";
import { useImageActions } from "../useImageActions";
import {
  formatBytes,
  calculateSizeReduction,
} from "../../app/utils/image-utils";

/**
 * Custom hook for managing image statistics
 *
 * Provides functionality to:
 * - Initialize image statistics when a new image is loaded
 * - Update statistics after image processing operations
 * - Format statistics for display
 * - Calculate size reduction and savings
 */
export const useImageStats = () => {
  // Use selective state from the store
  const selectedImage = useImageStore((state) => state.selectedImage);
  const originalStats = useImageStore((state) => state.originalStats);
  const newStats = useImageStore((state) => state.newStats);
  const dataSavings = useImageStore((state) => state.dataSavings);
  const format = useImageStore((state) => state.format);

  // Get the actions
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

      img.onerror = () => {
        console.error("Error loading image for stats calculation");
      };

      img.src = selectedImage.url;
    }
  }, [selectedImage, originalStats, actions]);

  // Update stats after image processing
  const updateStatsAfterProcessing = useCallback(
    async (imageUrl: string) => {
      try {
        // Create a promise to handle the blob fetch
        const blobPromise = fetch(imageUrl).then((r) => r.blob());

        // Create a promise to handle the image loading
        const imagePromise = new Promise<HTMLImageElement>(
          (resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Failed to load image"));
            img.src = imageUrl;
          }
        );

        // Wait for both operations to complete
        const [blob, img] = await Promise.all([blobPromise, imagePromise]);

        // Create new stats object
        const newStatsObj = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: blob.size,
          format: format,
        };

        // Update state
        actions.setNewStats(newStatsObj);

        // Calculate savings if original stats exist
        if (originalStats) {
          const savings = calculateSizeReduction(originalStats.size, blob.size);
          actions.setDataSavings(savings);
        }

        return newStatsObj;
      } catch (error) {
        console.error("Error updating stats:", error);
        return null;
      }
    },
    [format, originalStats, actions]
  );

  // Get formatted stats for display - memoized to prevent unnecessary recalculations
  const getFormattedStats = useMemo(() => {
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
        ratio:
          originalStats && newStats && newStats.size > 0
            ? (originalStats.size / newStats.size).toFixed(2) + ":1"
            : "1:1",
      },
      dimensions: {
        changeX:
          originalStats && newStats
            ? Math.round((newStats.width / originalStats.width) * 100)
            : 100,
        changeY:
          originalStats && newStats
            ? Math.round((newStats.height / originalStats.height) * 100)
            : 100,
      },
    };
  }, [originalStats, newStats, dataSavings]);

  // Helper function to determine if an image was significantly optimized
  const isOptimized = useMemo(() => {
    if (!originalStats || !newStats) return false;
    return dataSavings > 20; // Consider optimized if savings are more than 20%
  }, [originalStats, newStats, dataSavings]);

  return {
    // State
    originalStats,
    newStats,
    dataSavings,

    // Functions
    updateStatsAfterProcessing,
    getFormattedStats,
    isOptimized,

    // Utilities (re-exported for convenience)
    formatBytes,
    calculateSizeReduction,
  };
};

/**
 * History management hook for tracking image editing states
 * Uses its own internal Zustand store independent of the main image store
 */
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

/**
 * Enhanced useImageHistory hook with Zustand integration
 * Connects the history store with the main image store
 */
export const useImageHistoryWithStore = () => {
  const history = useImageHistory();
  const selectedImage = useImageStore((state) => state.selectedImage);
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
