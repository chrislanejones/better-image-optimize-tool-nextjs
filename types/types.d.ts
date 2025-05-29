// Complete updated types.d.ts with combined definitions
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint" | "text";

// Define editor states matching the component implementation
export type EditorState =
  | "resizeAndOptimize" // Simple resize & optimize state (view) - Has aside
  | "editImage" // Basic Edit Tools (edit)
  | "multiImageEdit" // Coming soon
  | "crop" // Cropping mode
  | "blur" // Blur tool mode
  | "paint" // Paint tool mode
  | "text"; // Text tool mode

// Format types
export type ImageFormat = "jpeg" | "png" | "webp";

// Core Web Vitals Score Type
export type CoreWebVitalsScore =
  | "poor"
  | "almost-there"
  | "needs-improvement"
  | "good";

export type NavigationDirection =
  | "next" // Move to next item
  | "prev" // Move to previous item
  | "next10" // Jump forward 10 items
  | "prev10"; // Jump backward 10 items

export interface ImageFile {
  id: string;
  file: File;
  url: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface ImageInfo {
  id: string;
  width: number;
  height: number;
  size: number;
  format: string;
  url: string;
}

export interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface EditorStateInfo {
  history: string[];
  historyIndex: number;
  hasEdited: boolean;
  zoom: number;
}

// Pagination component types
export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onNavigateImage: (direction: NavigationDirection) => void;
  isDisabled?: boolean;
  className?: string;
  compact?: boolean;
}

export interface PaginationWithPreviewProps extends PaginationControlsProps {
  currentImageUrl?: string;
  nextImageUrl?: string;
  prevImageUrl?: string;
}

export interface ImageListPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export interface ThumbnailStripProps {
  images: ImageInfo[];
  currentImageId?: string;
  onSelectImage: (id: string) => void;
  onRemoveImage?: (id: string) => void;
  className?: string;
  visibleCount?: number;
}

export interface ImagePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onNavigateImage: (direction: NavigationDirection) => void;
  isDisabled?: boolean;
  className?: string;
}

// SimplePagination props
export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onBackTen?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onForwardTen?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  isDisabled?: boolean;
  className?: string;
}

// Editor component props
export interface ImageCropperProps {
  image: ImageFile | null;
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onBackToGallery?: () => void;
  isStandalone?: boolean;
  onEditModeChange?: (isEditMode: boolean) => void;
  onCompressionStateChange?: (isCompressing: boolean) => void;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: NavigationDirection) => void;
  // Enhanced pagination props
  allImages?: ImageInfo[];
  currentImageId?: string;
  onSelectImage?: (id: string) => void;
}

// Image Editor Props - now with proper typing
export interface ImageEditorProps {
  imageUrl: string;
  onImageChange?: (url: string) => void;
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
  onNavigateImage?: (direction: NavigationDirection) => void;
  // Additional props
  onRemoveAll?: () => void;
  onUploadNew?: () => void;
  allImages?: ImageFile[];
  currentImageId?: string;
  onSelectImage?: (image: ImageFile) => void;
  // For edit mode state management
  onEditModeChange?: (isEditMode: boolean) => void;
}

export interface ImageEditorToolbarProps {
  editorState: EditorState;
  isCompressing: boolean;
  zoom: number;
  historyIndex: number;
  historyLength: number;
  currentPage?: number;
  totalPages?: number;
  padlockAnimation: boolean;
  multiCropData: any;
  blurAmount: number;
  blurRadius: number;
  allImages?: any[];

  // Actions
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onReset: () => void;
  onClose?: () => void;
  onRemoveAll?: () => void;
  onUploadNew?: () => void;
  onNavigateImage?: (direction: NavigationDirection) => void;
  onStateChange: (state: EditorState) => void;
  onApplyCrop: () => void;
  onApplyBlur: () => void;
  onApplyPaint: () => void;
  onApplyText: () => void;
  onBlurAmountChange: (amount: number) => void;
  onBlurRadiusChange: (radius: number) => void;
  onMultiCropApply: () => void;
  onExitEditMode: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
  onReset?: () => void;
}

interface EditImageToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onReset: () => void;
  onExitEditMode: () => void;
}

// Extended Image Editor Props with additional functions
export interface ExtendedImageEditorProps extends ImageEditorProps {
  onEditModeChange?: (isEditMode: boolean) => void;
}

// Image Gallery Props - new interface for the gallery component
export interface ImageGalleryProps {
  images: ImageFile[];
  onUploadNew: () => void;
  onRemoveAll: () => void;
  onClose?: () => void;
  onSelectImage?: (image: ImageFile) => void;
  onRemoveImage?: (id: string) => void;
  onNavigateImage?: (direction: NavigationDirection) => void;
  className?: string;
  currentPage?: number;
  totalPages?: number;
  currentImageId?: string;
}

// Updated ImageResizerProps with quality handling
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
  isCompressing?: boolean;
  // Pagination props
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;
  // New props for quality
  quality?: number;
  onQualityChange?: (quality: number) => void;
}

// Extended ImageResizerProps
export interface ExtendedImageEditorProps extends ImageEditorProps {
  onEditModeChange?: (isEditMode: boolean) => void;
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
  clear: () => void;
}

export interface TextToolRef {
  applyText: () => void;
  getCanvasDataUrl: () => string | null;
}

export interface TextToolProps {
  imageUrl: string;
  onApplyText: (dataUrl: string) => void;
  onCancel: () => void;
  setEditorState: (state: string) => void;
  setBold: (isBold: boolean) => void;
  setItalic: (isItalic: boolean) => void;
}

export interface CroppingToolRef {
  getCanvasDataUrl: () => string | null;
  getCrop: () => any | null;
  getImageRef: () => HTMLImageElement | null;
  applyCrop: () => void;
}

// Cropping tool props
export interface CroppingToolProps {
  imageUrl: string;
  onApply: (croppedImageUrl: string) => void;
  onCancel: () => void;
  className?: string;
  aspectRatio?: number | undefined;
}

// Blur brush canvas props
export interface BlurBrushCanvasProps {
  imageUrl: string;
  blurAmount: number;
  blurRadius: number;
  zoom?: number;
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
  onBlurAmountChange?: (amount: number) => void;
  onBlurRadiusChange?: (radius: number) => void;
}

export interface BlurBrushCanvasProps {
  imageUrl: string;
  blurAmount: number;
  blurRadius: number;
  zoom?: number;
  onApply: (blurredImageUrl: string) => void;
  onCancel: () => void;
  onBlurAmountChange?: (amount: number) => void;
  onBlurRadiusChange?: (radius: number) => void;
}

// Paint tool props
export interface PaintToolProps {
  imageUrl: string;
  onApplyPaint: (paintedImageUrl: string) => void;
  onCancel: () => void;
  onToggleEraser?: () => void;
  isEraser: boolean;
  brushSize?: number;
  brushColor?: string;
  onBrushSizeChange?: (size: number) => void;
  onBrushColorChange?: (color: string) => void;
}

// Image zoom view props
export interface ImageZoomViewProps {
  imageUrl: string;
}
interface MousePosition {
  x: number;
  y: number;
}

// Main Toolbar Props
export interface ToolbarProps {
  // Mode flags
  isEditMode: boolean;
  isCropping: boolean;
  isBlurring: boolean;
  isPainting: boolean;
  isEraser: boolean;
  isCompressing?: boolean;

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
  onApplyCrop?: () => void;
  onApplyBlur?: (url: string) => void;
  onApplyPaint?: (url: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  onUploadNew?: () => void;
  onRemoveAll?: () => void;
  onCancelBlur?: () => void;
  onCancelCrop?: () => void;
  onCancelPaint?: () => void;
  onBackToGallery?: () => void;
  onExitEditMode?: () => void;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: NavigationDirection) => void;

  isStandalone?: boolean;
  className?: string;
}
export interface UseImageEditorProps {
  imageUrl: string;
  fileSize: number;
  fileType: string;
  format: string;
  onImageChange?: (url: string) => void;
  onEditModeChange?: (isEditMode: boolean) => void;
}

interface ImageEditorCanvasProps {
  editorState: EditorState;
  imageUrl: string;
  zoom: number;
  width: number;
  height: number;
  allImages?: any[];
  currentImageId?: string;
  multiCropData: any;
  blurAmount: number;
  blurRadius: number;
  isEraser: boolean;

  // Actions
  onSelectImage?: (image: any) => void;
  onStateChange: (state: EditorState) => void;
  onCropResult: (url: string) => void;
  onBlurResult: (url: string) => void;
  onPaintResult: (url: string) => void;
  onTextResult: (url: string) => void;
  setMultiCropData: (data: any) => void;
  setBold: (bold: boolean) => void;
  setItalic: (italic: boolean) => void;
  setIsEraser: (eraser: boolean) => void;

  // Refs
  cropToolRef: React.RefObject<any>;
  blurCanvasRef: React.RefObject<any>;
  paintToolRef: React.RefObject<any>;
  textToolRef: React.RefObject<any>;
  imgRef: React.RefObject<HTMLImageElement | null>;
}
