// types/image.types.ts

import { MutableRefObject } from "react";
import { PixelCrop } from "react-image-crop";

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
  // Image collection
  images: ImageFile[];
  paginatedFiles: any[];
  selectedFile: any | null;
  selectedImage: ImageFile | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadComplete: boolean;
  newImageAdded: boolean;
  isDragging: boolean;

  // Editor UI state
  isEditMode: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isCropping: boolean;
  isStandalone?: boolean;
  isFullScreen?: boolean;

  // Tool settings
  brushColor: string;
  brushSize: number;
  isEraser: boolean;
  blurAmount: number;
  blurRadius: number;
  zoom: number;

  // Image processing
  previewUrl: string;
  width: number;
  height: number;
  imageRef: MutableRefObject<HTMLImageElement | null> | null;
  canvasRef: MutableRefObject<HTMLCanvasElement | null> | null;
  completedCrop: PixelCrop | null;

  // Image stats
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  format: string;
  currentPage: number;
}

export interface ImageActions {
  // Image collection actions
  setImages: (images: ImageFile[]) => void;
  addImages: (newImages: ImageFile[]) => void;
  removeImage: (id: string) => void;
  selectImage: (image: ImageFile | null) => void;

  // UI state actions
  setUploadComplete: (complete: boolean) => void;
  setNewImageAdded: (added: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setIsEditMode: (mode: boolean) => void;
  setIsBlurring: (blurring: boolean) => void;
  setIsPainting: (painting: boolean) => void;
  setIsCropping: (cropping: boolean) => void;
  setIsStandalone?: (standalone: boolean) => void;
  setIsFullScreen?: (fullscreen: boolean) => void;

  // Tool settings actions
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsEraser: (eraser: boolean) => void;
  setBlurAmount: (amount: number) => void;
  setBlurRadius: (radius: number) => void;
  setZoom: (zoom: number) => void;

  // Image processing actions
  setPreviewUrl: (url: string) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setImageRef: (ref: MutableRefObject<HTMLImageElement | null>) => void;
  setCanvasRef: (ref: MutableRefObject<HTMLCanvasElement | null>) => void;
  setCompletedCrop: (crop: PixelCrop | null) => void;

  // Image stats actions
  setOriginalStats: (stats: ImageStats | null) => void;
  setNewStats: (stats: ImageStats | null) => void;
  setDataSavings: (savings: number) => void;
  setHasEdited: (edited: boolean) => void;
  setFormat: (format: string) => void;
  setCurrentPage: (page: number) => void;

  // Reset actions
  resetEditor: () => void;
  resetAll: () => void;

  // Cleanup function
  cleanupObjectURLs: () => void;
}

export type ImageStore = ImageState & ImageActions;
