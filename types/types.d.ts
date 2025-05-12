/**
 * Image editor interface types
 */

// Editor modes
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint";

// Format types
export type ImageFormat = "jpeg" | "png" | "webp";

// types.ts - Image related types

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

export interface ImageCropperProps {
  image: ImageFile | null;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
}

export interface ImageEditorProps {
  imageUrl: string;
  onImageChange: (newImageUrl: string) => void;
  onReset?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
  onRemoveAll?: () => void;
  onUploadNew?: () => void;
}

export interface ImageResizerProps {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  onResize: (width: number, height: number) => void;
  onApplyResize: () => void;
  format: string;
  onFormatChange: (format: string) => void;
  onDownload?: () => void;
  isCompressing?: boolean;
  // Optional pagination props
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
}

export interface ImageStatsProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  fileName: string;
  format: string;
  fileType: string;
}

// Canvas and tool types
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint";

export interface BlurControlsProps {
  blurAmount: number;
  blurRadius: number;
  onBlurAmountChange: (amount: number) => void;
  onBlurRadiusChange: (radius: number) => void;
}

export interface PaintControlsProps {
  brushSize: number;
  brushColor: string;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
}

export interface BlurBrushCanvasRef {
  getCanvasDataUrl: () => string | null;
  clear: () => void;
}

export interface PaintToolRef {
  getCanvasDataUrl: () => string | null;
}

export interface CroppingToolRef {
  getCanvasDataUrl: () => string | null;
  getCrop: () => PixelCrop | null;
  getImageRef: () => HTMLImageElement | null;
  applyCrop: () => void;
}
// Cropping tool props
export interface CroppingToolProps {
  imageUrl: string;
  onApply: (croppedImageUrl: string) => void;
  onCancel: () => void;
  className?: string;
}

// Image Cropper props
export interface ImageCropperProps {
  image: ImageFile;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
}

// Image stats props
export interface ImageStatsProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  fileName: string;
  format: string;
  fileType: string;
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
}

// Image resizer props

export interface ImageResizerProps {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  onResize: (width: number, height: number) => void;
  onApplyResize: () => void;
  format: string;
  onFormatChange: (format: string) => void;
  onDownload?: () => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;
  // Add this new property
  isCompressing?: boolean;
}

// Placeholder component props
export interface ImagePlaceholderProps {
  className?: string;
  alt?: string;
}

export interface LoadingPlaceholderProps {
  text?: string;
  className?: string;
}

export interface EmptyPlaceholderProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export interface MagnifierPlaceholderProps {
  className?: string;
}

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// Image editor props
export interface ImageEditorProps {
  imageUrl: string;
  onImageChange: (newImageUrl: string) => void;
  onReset?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
}

// Main Toolbar Props
export interface ToolbarProps {
  // Mode flags
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isEraser: boolean;
  isCompressing?: boolean; // New flag to track compression state

  // Format
  format: string;
  onFormatChange: (format: string) => void;

  // Mode toggles
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleEraser: () => void;

  // Action handlers
  onApplyCrop: () => void;
  onApplyBlur: (url: string) => void;
  onApplyPaint: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  onUploadNew?: () => void;
  onRemoveAll?: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onBackToGallery?: () => void;
  onExitEditMode: () => void;

  // Blur controls
  blurAmount?: number;
  blurRadius?: number;
  onBlurAmountChange?: (size: number) => void;
  onBlurRadiusChange?: (size: number) => void;

  // Paint controls
  brushSize?: number;
  brushColor?: string;
  onBrushSizeChange?: (size: number) => void;
  onBrushColorChange?: (color: string) => void;

  // Pagination
  images?: any[];
  selectedImage?: any;
  setSelectedImage?: (image: any) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: "next" | "prev" | "first" | "last") => void;

  isStandalone?: boolean;
  className?: string;
}
