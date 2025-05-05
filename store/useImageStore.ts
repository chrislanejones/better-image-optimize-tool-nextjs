// store/useImageStore.ts
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface ImageFile {
  id: string;
  file: File;
  url: string;
  isNew?: boolean;
}

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageState {
  // Images state
  images: ImageFile[];
  selectedImage: ImageFile | null;
  uploadComplete: boolean;
  newImageAdded: boolean;
  isDragging: boolean;
  isEditMode: boolean;

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

  // Image processing state
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  format: string;

  // Actions
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
  setOriginalStats: (stats: ImageStats | null) => void;
  setNewStats: (stats: ImageStats | null) => void;
  setDataSavings: (savings: number) => void;
  setHasEdited: (edited: boolean) => void;
  setFormat: (format: string) => void;
  resetEditor: () => void;
  resetAll: () => void;
}

const initialState = {
  images: [],
  selectedImage: null,
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
  originalStats: null,
  newStats: null,
  dataSavings: 0,
  hasEdited: false,
  format: "jpeg",
};

export const useImageStore = create<ImageState>()(
  devtools(
    persist(
      immer((set) => ({
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
        setOriginalStats: (stats) => set({ originalStats: stats }),
        setNewStats: (stats) => set({ newStats: stats }),
        setDataSavings: (savings) => set({ dataSavings: savings }),
        setHasEdited: (edited) => set({ hasEdited: edited }),
        setFormat: (format) => set({ format }),

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

        resetAll: () =>
          set((state) => {
            Object.assign(state, initialState);
          }),
      })),
      {
        name: "image-editor-storage",
        partialize: (state) => ({
          images: state.images,
          uploadComplete: state.uploadComplete,
          // Only persist non-ephemeral state
        }),
      }
    )
  )
);

// Selectors for better performance
export const useImageSelector = () => useImageStore((state) => state);

export const useImageActions = () =>
  useImageStore((state) => ({
    setImages: state.setImages,
    addImages: state.addImages,
    removeImage: state.removeImage,
    selectImage: state.selectImage,
    setUploadComplete: state.setUploadComplete,
    setNewImageAdded: state.setNewImageAdded,
    setIsDragging: state.setIsDragging,
    setIsEditMode: state.setIsEditMode,
    setIsBlurring: state.setIsBlurring,
    setIsPainting: state.setIsPainting,
    setIsCropping: state.setIsCropping,
    setBrushColor: state.setBrushColor,
    setBrushSize: state.setBrushSize,
    setIsEraser: state.setIsEraser,
    setBlurAmount: state.setBlurAmount,
    setBlurRadius: state.setBlurRadius,
    setZoom: state.setZoom,
    setPreviewUrl: state.setPreviewUrl,
    setOriginalStats: state.setOriginalStats,
    setNewStats: state.setNewStats,
    setDataSavings: state.setDataSavings,
    setHasEdited: state.setHasEdited,
    setFormat: state.setFormat,
    resetEditor: state.resetEditor,
    resetAll: state.resetAll,
  }));

// Effect for automatic cleanup
export const useImageCleanup = () => {
  useImageStore(
    subscribeWithSelector(
      (state) => ({
        images: state.images,
        previewUrl: state.previewUrl,
      }),
      (prev, curr) => {
        // Clean up old URLs when images change
        prev.images.forEach((img) => {
          if (!curr.images.some((newImg) => newImg.id === img.id)) {
            URL.revokeObjectURL(img.url);
          }
        });

        // Clean up old preview URL
        if (prev.previewUrl && prev.previewUrl !== curr.previewUrl) {
          URL.revokeObjectURL(prev.previewUrl);
        }
      }
    )
  );
};
