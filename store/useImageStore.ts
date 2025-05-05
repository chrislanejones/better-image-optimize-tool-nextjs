// store/useImageStore.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { MutableRefObject } from "react";

export interface ImageFile {
  id: string;
  file: File;
  url: string;
  isNew?: boolean;
}

export interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageState {
  // Images state
  images: ImageFile[];
  paginatedFiles: ImageFile[];
  selectedFile: ImageFile | null;
  selectedImage: ImageFile | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadComplete: boolean;
  newImageAdded: boolean;
  isDragging: boolean;
  isEditMode: boolean;
  currentPage: number;

  // Editor state
  isBlurring: boolean;
  isPainting: boolean;
  isCropping: boolean;
  brushColor: string;
  brushSize: number;
  isEraser: boolean;
  blurAmount: number;
  blurRadius: number;
  zoom: number;
  previewUrl: string;
  width: number;
  height: number;
  imageRef: MutableRefObject<HTMLImageElement | null> | null;
  canvasRef: MutableRefObject<HTMLCanvasElement | null> | null;

  // Image processing state
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  format: string;
}

interface ImageActions {
  setImages: (images: ImageFile[]) => void;
  addImages: (newImages: ImageFile[]) => void;
  removeImage: (id: string) => void;
  selectImage: (image: ImageFile | null) => void;
  setUploadComplete: (complete: boolean) => void;
  setNewImageAdded: (added: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsEditMode: (mode: boolean) => void;
  setIsBlurring: (blurring: boolean) => void;
  setIsPainting: (painting: boolean) => void;
  setIsCropping: (cropping: boolean) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsEraser: (eraser: boolean) => void;
  setBlurAmount: (amount: number) => void;
  setBlurRadius: (radius: number) => void;
  setZoom: (zoom: number) => void;
  setPreviewUrl: (url: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setImageRef: (ref: MutableRefObject<HTMLImageElement | null>) => void;
  setCanvasRef: (ref: MutableRefObject<HTMLCanvasElement | null>) => void;
  setOriginalStats: (stats: ImageStats | null) => void;
  setNewStats: (stats: ImageStats | null) => void;
  setDataSavings: (savings: number) => void;
  setHasEdited: (edited: boolean) => void;
  setFormat: (format: string) => void;
  setCurrentPage: (page: number) => void;
  resetEditor: () => void;
  resetAll: () => void;
  cleanupObjectURLs: () => void;
}

export type ImageStore = ImageState & ImageActions;

const initialState: ImageState = {
  images: [],
  paginatedFiles: [],
  selectedFile: null,
  selectedImage: null,
  isUploading: false,
  uploadProgress: 0,
  error: null,
  uploadComplete: false,
  newImageAdded: false,
  isDragging: false,
  isEditMode: false,
  isBlurring: false,
  isPainting: false,
  isCropping: false,
  brushColor: "#ff0000",
  brushSize: 10,
  isEraser: false,
  blurAmount: 5,
  blurRadius: 10,
  zoom: 1,
  previewUrl: "",
  width: 0,
  height: 0,
  imageRef: null,
  canvasRef: null,
  originalStats: null,
  newStats: null,
  dataSavings: 0,
  hasEdited: false,
  format: "jpeg",
  currentPage: 1,
};

export const useImageStore = create<ImageStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setImages: (images) => set({ images }),

        addImages: (newImages) =>
          set((state) => {
            state.images = [...state.images, ...newImages];
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

            // Reset stats
            state.hasEdited = false;
            state.originalStats = null;
            state.newStats = null;
          }),

        setUploadComplete: (complete) => set({ uploadComplete: complete }),
        setNewImageAdded: (added) => set({ newImageAdded: added }),
        setIsDragging: (dragging) => set({ isDragging: dragging }),
        setIsEditMode: (mode) => set({ isEditMode: mode }),
        setIsBlurring: (blurring) => set({ isBlurring: blurring }),
        setIsPainting: (painting) => set({ isPainting: painting }),
        setIsCropping: (cropping) => set({ isCropping: cropping }),
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

        resetEditor: () =>
          set((state) => {
            state.isEditMode = false;
            state.isBlurring = false;
            state.isPainting = false;
            state.isCropping = false;
            state.zoom = 1;
            state.hasEdited = false;
            state.newStats = null;
            state.previewUrl = state.selectedImage?.url || "";
          }),

        resetAll: () => set(() => ({ ...initialState })),

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

// Helper for actions
export const useImageActions = () => {
  const store = useImageStore();
  return {
    setImages: store.setImages,
    addImages: store.addImages,
    removeImage: store.removeImage,
    selectImage: store.selectImage,
    setUploadComplete: store.setUploadComplete,
    setNewImageAdded: store.setNewImageAdded,
    setIsDragging: store.setIsDragging,
    setIsEditMode: store.setIsEditMode,
    setIsBlurring: store.setIsBlurring,
    setIsPainting: store.setIsPainting,
    setIsCropping: store.setIsCropping,
    setBrushColor: store.setBrushColor,
    setBrushSize: store.setBrushSize,
    setIsEraser: store.setIsEraser,
    setBlurAmount: store.setBlurAmount,
    setBlurRadius: store.setBlurRadius,
    setZoom: store.setZoom,
    setPreviewUrl: store.setPreviewUrl,
    setWidth: store.setWidth,
    setHeight: store.setHeight,
    setImageRef: store.setImageRef,
    setCanvasRef: store.setCanvasRef,
    setOriginalStats: store.setOriginalStats,
    setNewStats: store.setNewStats,
    setDataSavings: store.setDataSavings,
    setHasEdited: store.setHasEdited,
    setFormat: store.setFormat,
    setCurrentPage: store.setCurrentPage,
    resetEditor: store.resetEditor,
    resetAll: store.resetAll,
  };
};

// Effect for automatic cleanup
export const useImageCleanup = () => {
  useEffect(() => {
    const cleanup = useImageStore.getState().cleanupObjectURLs;

    // Clean up URLs when the component unmounts
    return () => {
      cleanup();
    };
  }, []);
};

import { useEffect } from "react";
