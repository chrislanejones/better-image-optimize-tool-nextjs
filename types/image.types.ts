// types/image.types.ts
import { RefObject } from "react";
import { Crop as CropType, PixelCrop } from "react-image-crop";

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

export interface ImageState {
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
  imageRef: RefObject<HTMLImageElement> | null;
  canvasRef: RefObject<HTMLCanvasElement> | null;
  completedCrop: PixelCrop | null;

  // Image processing state
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  format: string;
}

export interface ImageActions {
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
  setImageRef: (ref: RefObject<HTMLImageElement>) => void;
  setCanvasRef: (ref: RefObject<HTMLCanvasElement>) => void;
  setOriginalStats: (stats: ImageStats | null) => void;
  setNewStats: (stats: ImageStats | null) => void;
  setDataSavings: (savings: number) => void;
  setHasEdited: (edited: boolean) => void;
  setFormat: (format: string) => void;
  setCurrentPage: (page: number) => void;
  setCompletedCrop: (crop: PixelCrop | null) => void;
  resetEditor: () => void;
  resetAll: () => void;
  cleanupObjectURLs: () => void;
}

export type ImageStore = ImageState & ImageActions;
