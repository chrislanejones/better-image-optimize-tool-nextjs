// Auto-generated types file managed by Types Cleanup 🧹
// This file is automatically updated when you save TypeScript files

export type CoreWebVitalsScore =
  | "poor"
  | "needs-improvement"
  | "almost-there"
  | "good";

export type EditorState =
  | "resizeAndOptimize"
  | "editImage"
  | "bulkImageEdit"
  | "crop"
  | "blur"
  | "paint"
  | "text"
  | "bulkCrop"
  | "bulkTextEditor";

export type ImageFormat = "jpeg" | "png" | "webp";

export type NavigationDirection = "next" | "prev" | "next10" | "prev10";

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

export interface BlurBrushCanvasRef {
  getCanvasDataUrl: () => string | null;
  clear: () => void;
}

export interface BulkImageEditorProps {
  className?: string;
  currentPage?: number;
  images: ImageFile[];
  onClose?: () => void;
  onNavigateImage?: (direction: NavigationDirection) => void;
  onRemoveAll?: () => void;
  onSelectImage: (imageId: string) => void;
  onStateChange: (state: EditorState) => void;
  onUploadNew?: () => void;
  selectedImageId: string;
  totalPages?: number;
}

export interface CroppingToolProps {
  imageUrl: string;
  onApply: (croppedImageUrl: string) => void;
  onCancel: () => void;
  className?: string;
  aspectRatio?: number;
}

export interface CroppingToolRef {
  getCanvasDataUrl: () => string | null;
  getCrop: () => any | null;
  getImageRef: () => HTMLImageElement | null;
  applyCrop: () => void;
}

export interface EditorCanvasProps {
  editorState: EditorState;
  imageUrl: string;
  zoom?: number;
  width?: number;
  height?: number;
  allImages?: ImageDataItem[];
  currentImageId?: string;
  crop?: { x: number; y: number; width: number; height: number };
  aspect?: number;
  rotation?: number;
  showCrop?: boolean;
  onCropChange?: (crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onZoomChange?: (zoom: number) => void;
  onCropComplete?: () => void;
  showPaint?: boolean;
  paintStrokes?: PaintStroke[];
  isBlurring?: boolean;
  blurAmount?: number;
  blurRadius?: number;
  blurData?: any;
  textOverlays?: TextOverlay[];
  imgRef?: React.RefObject<HTMLImageElement | null>;
  cropToolRef?: React.Ref<any>;
  blurCanvasRef?: React.Ref<any>;
  paintToolRef?: React.Ref<any>;
  textToolRef?: React.Ref<any>;
  onCropResult?: (result: any) => void;
  onBlurResult?: (result: any) => void;
  onPaintResult?: (result: any) => void;
  onTextResult?: (result: any) => void;
  onStateChange?: (state: EditorState) => void;
  setMultiCropData?: (cropData: any) => void;
  setBold?: (bold: boolean) => void;
  setItalic?: (italic: boolean) => void;
  setIsEraser?: (value: boolean) => void;
  isEraser?: boolean;
  isBulkMode: boolean;
  bulkCropData?: any;
  onSelectImage?: (image: ImageFile) => void;
}

export interface ExtendedImageEditorProps extends ImageEditorProps {
  onEditModeChange?: (isEditMode: boolean) => void;
}

export interface ImageDataItem {
  id: string;
  url: string;
  file?: File;
}

export interface ImageEditorProps {
  imageUrl: string;
  onImageChange?: (url: string) => void;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;
  onRemoveAll?: () => void;
  onUploadNew?: () => void;
  allImages?: ImageFile[];
  currentImageId?: string;
  onSelectImage?: (image: ImageFile) => void;
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
  bulkCropData: any;
  blurAmount: number;
  blurRadius: number;
  allImages?: any[];
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
  onBulkCropApply: () => void;
  onExitEditMode: () => void;
  onFlipHorizontal?: () => void;
  onFlipVertical?: () => void;
}

export interface ImageFile {
  id: string;
  file: File;
  url: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

export interface ImageResizerProps {
  width: number;
  height: number;
  maxWidth: number;
  maxHeight: number;
  onResize: (width: number, height: number) => void;
  onApplyResize: () => void;
  format: string;
  onReset: () => void;
  onFormatChange: (format: string) => void;
  onDownload?: () => void;
  isCompressing?: boolean;
  currentPage?: number;
  totalPages?: number;
  onNavigateImage?: (direction: NavigationDirection) => void;
  quality?: number;
  onQualityChange?: (quality: number) => void;
}

export interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
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

export interface ImageZoomViewProps {
  imageUrl: string;
}

export interface MousePosition {
  x: number;
  y: number;
}

export interface PaintStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

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

export interface PaintToolRef {
  getCanvasDataUrl: () => string | null;
  clear: () => void;
}

export interface RotationControlsProps {
  onRotate: (degrees: number) => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onReset: () => void;
  currentRotation?: number;
}

export interface SimplePaginationProps {
  allImages?: { id: string }[];
  className?: string;
  currentImageId?: string;
  currentPage: number;
  isDisabled?: boolean;
  onBackTen?: () => void;
  onForwardTen?: () => void;
  onNavigate?: (direction: NavigationDirection) => void;
  onNavigate?: (direction: NavigationDirection) => void; // Added for compatibility
  onNext?: () => void;
  onPrevious?: () => void;
  totalImages?: number; // New prop for total images count
  totalPages: number;
}

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  bold?: boolean;
  italic?: boolean;
}

export interface TextToolProps {
  imageUrl: string;
  onApplyText: (dataUrl: string) => void;
  onCancel: () => void;
  setEditorState: (state: EditorState) => void;
  setBold: (isBold: boolean) => void;
  setItalic: (isItalic: boolean) => void;
}

export interface TextToolRef {
  applyText: () => void;
  getCanvasDataUrl: () => string | null;
}

export interface UseImageEditorProps {
  imageUrl: string;
  fileSize: number;
  fileType: string;
  format: string;
  onImageChange?: (url: string) => void;
  onEditModeChange?: (isEditMode: boolean) => void;
}
