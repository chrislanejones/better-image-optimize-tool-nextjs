// types/editor.ts
import { type Crop as CropType, type PixelCrop } from "react-image-crop";

// Base types
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint";

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
}

export interface ImageControlsProps {
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isEraser: boolean;
  format: string;
  onFormatChange: (format: string) => void;
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleEraser: () => void;
  onApplyCrop: () => void;
  onApplyBlur: () => void;
  onApplyPaint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onBackToGallery?: () => void;
  onExitEditMode: () => void;
  isStandalone?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}
