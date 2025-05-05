// store/hooks/useImageNavigation.ts
import { useCallback } from "react";
import { useImageStore } from "../useImageStore";
import { useImageActions } from "../useImageActions";

export const useImageNavigation = () => {
  const images = useImageStore((state) => state.images);
  const selectedImage = useImageStore((state) => state.selectedImage);
  const actions = useImageActions();

  const getNavigationInfo = useCallback(() => {
    if (!selectedImage || !images.length) return null;

    const currentIndex = images.findIndex((img) => img.id === selectedImage.id);
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < images.length - 1;

    return {
      currentIndex,
      hasPrevious,
      hasNext,
      total: images.length,
    };
  }, [images, selectedImage]);

  const navigateToPrevious = useCallback(() => {
    const info = getNavigationInfo();
    if (!info?.hasPrevious) return;

    const previousImage = images[info.currentIndex - 1];
    actions.selectImage(previousImage);
  }, [images, getNavigationInfo, actions]);

  const navigateToNext = useCallback(() => {
    const info = getNavigationInfo();
    if (!info?.hasNext) return;

    const nextImage = images[info.currentIndex + 1];
    actions.selectImage(nextImage);
  }, [images, getNavigationInfo, actions]);

  return {
    getNavigationInfo,
    navigateToPrevious,
    navigateToNext,
  };
};
