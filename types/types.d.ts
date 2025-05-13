// Editor modes
export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint" | "text";

// Format types
export type ImageFormat = "jpeg" | "png" | "webp";

export type NavigationDirection =
  | "next" // Move to next item
  | "prev" // Move to previous item
  | "next10" // Jump forward 10 items
  | "prev10"; // Jump backward 10 items

export interface ImageFile {
  id: string;
  file: File;
  url: string;
}

export interface ImageInfo {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface EditorState {
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

export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export interface ImagePaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onNavigateImage: (direction: NavigationDirection) => void;
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
  onCompressionStateChange?: (isCompressing: boolean) => void; // Added compression state handler
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
  isCompressing?: boolean;
  // Pagination props - make sure these are consistent
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;
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
  // This is the fixed type - now it correctly accepts a string
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

// Paint tool props
export interface PaintToolProps {
  imageUrl: string;
  onApplyPaint: (paintedImageUrl: string) => void;
  onCancel: () => void;
  onToggleEraser: () => void;
  isEraser: boolean;
  brushSize?: number;
  brushColor?: string;
  onBrushSizeChange?: (size: number) => void;
  onBrushColorChange?: (color: string) => void;
}

// Image zoom view props
export interface ImageZoomViewProps {
  imageUrl: string;
  className?: string;
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

  // Pagination
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onNavigateImage?: (direction: NavigationDirection) => void;

  isStandalone?: boolean;
  className?: string;
}

// Enhanced Toolbar Props
export interface EnhancedToolbarProps {
  // Editor state
  editorState: string;
  setEditorState: (state: string) => void;

  // Format
  format: string;
  onFormatChange: (format: string) => void;

  // Zoom controls
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;

  // Tool states
  isEraser: boolean;
  setIsEraser: (value: boolean) => void;
  blurAmount: number;
  setBlurAmount: (value: number) => void;
  blurRadius: number;
  setBlurRadius: (value: number) => void;
  brushSize: number;
  setBrushSize: (value: number) => void;
  brushColor: string;
  setBrushColor: (value: string) => void;

  // Action handlers
  onReset?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  onRemoveAll?: () => void;
  onUploadNew?: () => void;

  // Tool action handlers
  onApplyCrop?: () => void;
  onApplyBlur?: () => void;
  onApplyPaint?: () => void;
  onApplyText?: () => void;

  // History handlers
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  // Rotation handlers
  onRotateClockwise?: () => void;
  onRotateCounterClockwise?: () => void;

  // Pagination
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;

  // Enhanced pagination
  allImages?: ImageInfo[];
  currentImageId?: string;
  onSelectImage?: (id: string) => void;

  className?: string;
}

// Image Gallery Props
export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onBackTen?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onForwardTen?: () => void;
  onNavigate?: (direction: NavigationDirection) => void; // Added for compatibility
  isDisabled?: boolean;
  className?: string;
}

// For backward compatibility
export type ImagePaginationControlsProps = SimplePaginationProps;
