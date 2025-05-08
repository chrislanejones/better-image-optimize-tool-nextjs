// hooks/use-edit-mode.ts
import { useState, useEffect } from "react";
import { ImageFile } from "@/types/editor";

/**
 * Custom hook to manage edit mode state and related functionality
 */
export function useEditMode(initialImages: ImageFile[] = []) {
  // Core edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMultiEditMode, setIsMultiEditMode] = useState(false);
  const [isGalleryMinimized, setIsGalleryMinimized] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

  // Tool states
  const [isCropping, setIsCropping] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isTexting, setIsTexting] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  // Debug edit mode state changes
  useEffect(() => {
    console.log("Edit mode state changed:", isEditMode);
  }, [isEditMode]);

  /**
   * Toggle edit mode on - fixed implementation that works reliably
   */
  const toggleEditMode = () => {
    console.log("toggleEditMode called - direct state changes");

    // Force edit mode on regardless of current state
    setIsEditMode(true);
    console.log("Directly setting isEditMode to true");

    // Ensure we have a selected image
    if (!selectedImage && initialImages.length > 0) {
      console.log("No image selected, selecting first image");
      setSelectedImage(initialImages[0]);
    }

    // Set other related states
    setIsGalleryMinimized(true);
    setIsMultiEditMode(false);

    // Reset other tool states to avoid conflicts
    setIsBlurring(false);
    setIsCropping(false);
    setPainting(false);
    setIsTexting(false);
  };

  /**
   * Toggle multi-edit mode
   */
  const toggleMultiEditMode = () => {
    setIsMultiEditMode(true);
    setIsEditMode(false);
    setIsGalleryMinimized(true);

    // Select the first image if none is selected
    if (!selectedImage && initialImages.length > 0) {
      setSelectedImage(initialImages[0]);
    }
  };

  /**
   * Exit edit mode completely
   */
  const exitEditMode = () => {
    setIsEditMode(false);
    setIsMultiEditMode(false);
    setIsGalleryMinimized(false);
    setIsCropping(false);
    setIsBlurring(false);
    setPainting(false);
    setIsTexting(false);
    setIsEraser(false);
  };

  // Tool toggling functions
  const toggleCropping = () => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
    setIsCropping((prev) => !prev);
    setIsBlurring(false);
    setPainting(false);
    setIsTexting(false);
  };

  const toggleBlurring = () => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
    setIsBlurring((prev) => !prev);
    setIsCropping(false);
    setPainting(false);
    setIsTexting(false);
  };

  const togglePainting = () => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
    setPainting((prev) => !prev);
    setIsCropping(false);
    setIsBlurring(false);
    setIsTexting(false);
  };

  const toggleTexting = () => {
    if (!isEditMode) {
      setIsEditMode(true);
    }
    setIsTexting((prev) => !prev);
    setIsCropping(false);
    setIsBlurring(false);
    setPainting(false);
  };

  const toggleEraser = () => {
    setIsEraser((prev) => !prev);
  };

  // Cancellation functions
  const cancelCrop = () => setIsCropping(false);
  const cancelBlur = () => setIsBlurring(false);
  const cancelPaint = () => setPainting(false);
  const cancelText = () => setIsTexting(false);

  // Alias for clarity
  const setPainting = setIsPainting;

  return {
    // States
    isEditMode,
    isMultiEditMode,
    isGalleryMinimized,
    selectedImage,
    isCropping,
    isBlurring,
    isPainting,
    isTexting,
    isEraser,

    // Setters
    setIsEditMode,
    setSelectedImage,
    setIsEraser,

    // Actions
    toggleEditMode,
    toggleMultiEditMode,
    exitEditMode,
    toggleCropping,
    toggleBlurring,
    togglePainting,
    toggleTexting,
    toggleEraser,
    cancelCrop,
    cancelBlur,
    cancelPaint,
    cancelText,
  };
}
