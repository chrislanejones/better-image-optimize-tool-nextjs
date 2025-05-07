// store/initialState.ts
import { ImageState } from "@/types/image.types";

export const initialState: ImageState = {
  // Image collection
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

  // Editor UI state
  isEditMode: false,
  isBlurring: false,
  isPainting: false,
  isCropping: false,
  isStandalone: false, // New property
  isFullScreen: false, // New property

  // Tool settings
  brushColor: "#ff0000",
  brushSize: 10,
  isEraser: false,
  blurAmount: 5,
  blurRadius: 10,
  zoom: 1,

  // Image processing
  previewUrl: "",
  width: 0,
  height: 0,
  imageRef: null,
  canvasRef: null,
  completedCrop: null,

  // Image stats
  originalStats: null,
  newStats: null,
  dataSavings: 0,
  hasEdited: false,
  format: "jpeg",
  currentPage: 1,
};
