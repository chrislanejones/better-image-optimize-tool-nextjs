// store/useImageActions.ts
import { useImageStore } from "./useImageStore";

export const useImageActions = () => {
  const store = useImageStore();

  return {
    setImages: store.setImages,
    addImages: store.addImages,
    removeImage: store.removeImage,
    selectImage: store.selectImage,
    setUploadComplete: store.setUploadComplete,
    setNewImageAdded: store.setNewImageAdded,
    setIsDragging: store.setIsDragging,
    setIsEditMode: store.setIsEditMode,
    setIsBlurring: store.setIsBlurring,
    setIsPainting: store.setIsPainting,
    setIsCropping: store.setIsCropping,
    setBrushColor: store.setBrushColor,
    setBrushSize: store.setBrushSize,
    setIsEraser: store.setIsEraser,
    setBlurAmount: store.setBlurAmount,
    setBlurRadius: store.setBlurRadius,
    setZoom: store.setZoom,
    setPreviewUrl: store.setPreviewUrl,
    setWidth: store.setWidth,
    setHeight: store.setHeight,
    setImageRef: store.setImageRef,
    setCanvasRef: store.setCanvasRef,
    setOriginalStats: store.setOriginalStats,
    setNewStats: store.setNewStats,
    setDataSavings: store.setDataSavings,
    setHasEdited: store.setHasEdited,
    setFormat: store.setFormat,
    setCurrentPage: store.setCurrentPage,
    setCompletedCrop: store.setCompletedCrop,
    resetEditor: store.resetEditor,
    resetAll: store.resetAll,
  };
};
