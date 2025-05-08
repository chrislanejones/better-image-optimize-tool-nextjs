// types/editor.ts
import { type Crop as CropType, type PixelCrop } from "react-image-crop";

// Base types
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint" | "text";

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

// Component ref types
export interface BlurBrushCanvasRef {
  getCanvasDataUrl: () => string | null;
  clear?: () => void;
}

export interface PaintToolRef {
  getCanvasDataUrl: () => string | null;
}

export interface TextToolRef {
  getCanvasDataUrl: () => string | null;
}

// Component prop interfaces
export interface ImageEditorProps {
  image?: ImageFile;
  onUploadNew?: () => void;
  onRemoveAll?: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface CroppingToolProps {
  imageUrl: string;
  onApplyCrop: (crop: PixelCrop, imageRef: HTMLImageElement) => void;
  onCancel: () => void;
  zoom?: number;
}

export interface BlurBrushCanvasProps {
  imageUrl: string;
  blurAmount: number;
  blurRadius: number;
  zoom?: number;
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
  onBlurAmountChange?: (value: number) => void;
  onBlurRadiusChange?: (value: number) => void;
}

export interface PaintToolProps {
  imageUrl: string;
  onApplyPaint: (paintedImageUrl: string) => void;
  onCancel: () => void;
  onToggleEraser: () => void;
  isEraser: boolean;
  zoom?: number;
  brushColor?: string;
  brushSize?: number;
}

export interface TextToolProps {
  imageUrl: string;
  onApplyText: (textedImageUrl: string) => void;
  onCancel: () => void;
  zoom?: number;
  textSize?: number;
  textFont?: string;
  textColor?: string;
}

export interface TextControlsProps {
  textSize: number;
  textFont: string;
  textColor: string;
  onTextSizeChange: (value: number) => void;
  onTextFontChange: (font: string) => void;
  onTextColorChange: (color: string) => void;
  className?: string;
}

export interface ImageControlsProps {
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isTexting?: boolean; // New prop for text tool state
  isEraser: boolean;
  format: string;
  onFormatChange: (format: string) => void;
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleTexting?: () => void; // New function for text tool toggle
  onToggleEraser: () => void;
  onApplyCrop: () => void;
  onApplyBlur: () => void;
  onApplyPaint: () => void;
  onApplyText?: () => void; // New function for applying text
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onCancelText?: () => void; // New function for canceling text tool
  onBackToGallery?: () => void;
  onExitEditMode: () => void;
  isStandalone?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface ImagePreviewProps {
  imageUrl: string;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isTexting?: boolean; // New prop for text tool state
  isEraser: boolean;
  zoom?: number;
  crop?: CropType;
  onCropChange: (crop: CropType) => void;
  onZoomChange: (zoom: number) => void;
}

export interface OptimizeApiRequest {
  image: ImageFile;
  options: {
    quality: number;
    format: "jpeg" | "png" | "webp" | "avif";
  };
}

export interface OptimizeApiResponse {
  success: boolean;
  optimizedImage?: ImageFile;
  error?: string;
}
