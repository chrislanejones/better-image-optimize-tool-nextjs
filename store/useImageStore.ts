// store/useImageStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  ImageStore,
  ImageState,
  ImageActions,
  ImageFile,
  ImageStats,
} from "../types/image.types";
import { initialState } from "./initialState";

// Re-export types
export type { ImageFile, ImageStats, ImageStore, ImageState, ImageActions };

export const useImageStore = create<ImageStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setImages: (images) => set({ images }),

        addImages: (newImages) =>
          set((state) => {
            state.images = [
              ...state.images,
              ...newImages.map((img) => ({
                ...img,
                isNew: true,
              })),
            ];
            if (newImages.length > 0) {
              state.uploadComplete = true;
              state.newImageAdded = true;
            }
          }),

        removeImage: (id) =>
          set((state) => {
            state.images = state.images.filter((img) => img.id !== id);
            if (state.selectedImage?.id === id) {
              state.selectedImage = null;
            }
            if (state.images.length === 0) {
              state.uploadComplete = false;
            }
          }),

        selectImage: (image) =>
          set((state) => {
            state.selectedImage = image;
            if (image?.url) {
              state.previewUrl = image.url;
            }
            // Reset editing state
            state.hasEdited = false;
            state.originalStats = null;
            state.newStats = null;
            state.completedCrop = null;
            state.isEditMode = false;
            state.isBlurring = false;
            state.isPainting = false;
            state.isCropping = false;
            state.zoom = 1;
          }),

        // Simple state setters
        setUploadComplete: (complete) => set({ uploadComplete: complete }),
        setNewImageAdded: (added) => set({ newImageAdded: added }),
        setIsDragging: (dragging) => set({ isDragging: dragging }),
        setIsEditMode: (mode) => set({ isEditMode: mode }),
        setIsBlurring: (blurring) => set({ isBlurring: blurring }),
        setIsPainting: (painting) => set({ isPainting: painting }),
        setIsCropping: (cropping) => set({ isCropping: cropping }),
        setIsStandalone: (standalone) => set({ isStandalone: standalone }),
        setIsFullScreen: (fullscreen) => set({ isFullScreen: fullscreen }),
        setBrushColor: (color) => set({ brushColor: color }),
        setBrushSize: (size) => set({ brushSize: size }),
        setIsEraser: (eraser) => set({ isEraser: eraser }),
        setBlurAmount: (amount) => set({ blurAmount: amount }),
        setBlurRadius: (radius) => set({ blurRadius: radius }),
        setZoom: (zoom) => set({ zoom }),
        setPreviewUrl: (url) => set({ previewUrl: url }),
        setWidth: (width) => set({ width }),
        setHeight: (height) => set({ height }),
        setImageRef: (ref) => set({ imageRef: ref }),
        setCanvasRef: (ref) => set({ canvasRef: ref }),
        setOriginalStats: (stats) => set({ originalStats: stats }),
        setNewStats: (stats) => set({ newStats: stats }),
        setDataSavings: (savings) => set({ dataSavings: savings }),
        setHasEdited: (edited) => set({ hasEdited: edited }),
        setFormat: (format) => set({ format }),
        setCurrentPage: (page) => set({ currentPage: page }),
        setCompletedCrop: (crop) => set({ completedCrop: crop }),

        resetEditor: () =>
          set((state) => {
            state.isEditMode = false;
            state.isBlurring = false;
            state.isPainting = false;
            state.isCropping = false;
            state.zoom = 1;
            state.hasEdited = false;
            state.newStats = null;
            state.completedCrop = null;
            if (state.selectedImage?.url) {
              state.previewUrl = state.selectedImage.url;
            }
          }),

        resetAll: () =>
          set((state) => {
            // Cleanup URLs before reset
            state.images.forEach((image) => {
              if (image.url.startsWith("blob:")) {
                URL.revokeObjectURL(image.url);
              }
            });
            if (
              state.previewUrl &&
              state.previewUrl.startsWith("blob:") &&
              state.previewUrl !== state.selectedImage?.url
            ) {
              URL.revokeObjectURL(state.previewUrl);
            }
            return initialState;
          }),

        cleanupObjectURLs: () => {
          const state = get();
          state.images.forEach((image) => {
            if (image.url.startsWith("blob:")) {
              URL.revokeObjectURL(image.url);
            }
          });

          if (
            state.previewUrl &&
            state.previewUrl.startsWith("blob:") &&
            state.previewUrl !== state.selectedImage?.url
          ) {
            URL.revokeObjectURL(state.previewUrl);
          }
        },
      })),
      {
        name: "image-editor-storage",
        partialize: (state) => ({
          images: state.images,
          uploadComplete: state.uploadComplete,
          currentPage: state.currentPage,
        }),
      }
    )
  )
);
