// store/hooks/useImageControls.ts
import { useCallback } from "react";
import { useImageStore } from "../useImageStore";
import { useImageActions } from "../useImageActions";

export const useImageControls = () => {
  const actions = useImageActions();
  const { selectedImage, previewUrl } = useImageStore();

  const toggleEditMode = useCallback(() => {
    actions.setIsEditMode(!useImageStore.getState().isEditMode);
  }, [actions]);

  const toggleCropping = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsCropping(!state.isCropping);
    actions.setIsBlurring(false);
    actions.setIsPainting(false);
  }, [actions]);

  const toggleBlurring = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsBlurring(!state.isBlurring);
    actions.setIsCropping(false);
    actions.setIsPainting(false);
  }, [actions]);

  const togglePainting = useCallback(() => {
    const state = useImageStore.getState();
    if (!state.isEditMode) {
      actions.setIsEditMode(true);
    }
    actions.setIsPainting(!state.isPainting);
    actions.setIsCropping(false);
    actions.setIsBlurring(false);
  }, [actions]);

  const toggleFullScreen = useCallback(() => {
    if (actions.setIsFullScreen) {
      // Check if the function exists before calling it
      const isFullScreen = useImageStore.getState().isFullScreen || false;
      actions.setIsFullScreen(!isFullScreen);
    }
  }, [actions]);

  const toggleStandalone = useCallback(() => {
    if (actions.setIsStandalone) {
      // Check if the function exists before calling it
      const isStandalone = useImageStore.getState().isStandalone || false;
      actions.setIsStandalone(!isStandalone);
    }
  }, [actions]);

  const zoomIn = useCallback(() => {
    const currentZoom = useImageStore.getState().zoom;
    actions.setZoom(Math.min(currentZoom + 0.1, 3));
  }, [actions]);

  const zoomOut = useCallback(() => {
    const currentZoom = useImageStore.getState().zoom;
    actions.setZoom(Math.max(currentZoom - 0.1, 0.5));
  }, [actions]);

  const resetImage = useCallback(() => {
    if (previewUrl && previewUrl !== selectedImage?.url) {
      URL.revokeObjectURL(previewUrl);
    }
    actions.resetEditor();
  }, [actions, previewUrl, selectedImage?.url]);

  return {
    toggleEditMode,
    toggleCropping,
    toggleBlurring,
    togglePainting,
    toggleFullScreen,
    toggleStandalone,
    zoomIn,
    zoomOut,
    resetImage,
  };
};
