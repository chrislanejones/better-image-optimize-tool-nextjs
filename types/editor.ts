// types/editor.ts
import { type Crop as CropType, type PixelCrop } from "react-image-crop";

// Base types
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
export interface ImageUploaderProps {
  onImagesUploaded: (images: ImageFile[]) => void;
  maxImages?: number;
}

export interface ImageGalleryProps {
  images: ImageFile[];
  onSelectImage: (image: ImageFile) => void;
  onRemoveImage: (id: string) => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onToggleEditMode?: () => void; // New prop for toggling edit mode
  onToggleMultiEditMode?: () => void; // New prop for toggling multi-edit mode
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isGalleryMinimized?: boolean;
  newImageAdded?: boolean;
}

export interface ImageEditorProps {
  image: ImageFile;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditing: boolean) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface MultiImageEditorProps {
  images: ImageFile[];
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  selectedImageId?: string;
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
  isTexting?: boolean;
  isEraser: boolean;
  format: string;
  onFormatChange: (format: string) => void;
  onToggleEditMode: () => void;
  onToggleCropping: () => void;
  onToggleBlurring: () => void;
  onTogglePainting: () => void;
  onToggleTexting?: () => void;
  onToggleEraser: () => void;
  onApplyCrop: () => void;
  onApplyBlur: () => void;
  onApplyPaint: () => void;
  onApplyText?: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onDownload: () => void;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onCancelBlur: () => void;
  onCancelCrop: () => void;
  onCancelPaint: () => void;
  onCancelText?: () => void;
  onBackToGallery?: () => void;
  onExitEditMode: () => void;
  onToggleMultiEditMode?: () => void;
  isStandalone?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
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
  onDownload: () => void;
}

export interface ImageZoomViewProps {
  imageUrl: string;
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
