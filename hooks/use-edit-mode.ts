// hooks/use-edit-mode.ts
import { useState, useCallback, useRef, useEffect } from "react";
import { type ImageFile } from "@/types/editor";

/**
 * Custom hook for managing edit mode state with improved stability
 * and strong locking mechanism
 */
export function useEditMode(images: ImageFile[]) {
  // Main edit mode states
  const [isEditMode, setIsEditModeState] = useState(false);
  const [isMultiEditMode, setIsMultiEditMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);

  // Tool states
  const [isCropping, setIsCropping] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isTexting, setIsTexting] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  // Refs for state tracking with stronger locking
  const editModeRef = useRef(false);
  const inTransitionRef = useRef(false);
  const lockTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceLockRef = useRef(false);
  const lastActionTimeRef = useRef(Date.now());

  // Keep editModeRef in sync with state
  useEffect(() => {
    editModeRef.current = isEditMode;
  }, [isEditMode]);

  // Check if we're within the throttle window
  const isThrottled = () => {
    const now = Date.now();
    return now - lastActionTimeRef.current < 500; // 500ms throttle
  };

  /**
   * Reliable method to set edit mode with proper state synchronization
   * and strong locking
   */
  const setIsEditMode = useCallback(
    (newState: boolean) => {
      console.log(`Setting edit mode: ${newState}`);

      // If force lock is active and trying to turn off edit mode, block it
      if (forceLockRef.current && !newState) {
        console.log("BLOCKED: Cannot turn off edit mode during force lock");
        return;
      }

      // Skip if we're already in a transition to avoid thrashing
      if (inTransitionRef.current) {
        console.log("Ignoring edit mode change during transition");
        return;
      }

      // Throttle rapid state changes
      if (isThrottled()) {
        console.log("Throttling rapid state changes");
        return;
      }

      // Update last action time
      lastActionTimeRef.current = Date.now();

      // Set transition flag
      inTransitionRef.current = true;

      // Update the ref immediately
      editModeRef.current = newState;

      // Clear any existing timeout
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }

      // Update actual state
      setIsEditModeState(newState);

      // If turning on edit mode, ensure we have an image selected
      if (newState && !selectedImage && images.length > 0) {
        setSelectedImage(images[0]);
      }

      // Clear transition flag after a delay
      lockTimeoutRef.current = setTimeout(() => {
        inTransitionRef.current = false;
        lockTimeoutRef.current = null;

        // Double-check state integrity after transition
        if (editModeRef.current !== isEditMode) {
          console.log("State inconsistency detected, fixing...");
          setIsEditModeState(editModeRef.current);
        }
      }, 500); // Longer delay to ensure stability
    },
    [images, selectedImage, isEditMode]
  );

  /**
   * Force edit mode on with a strict lock that prevents turning off
   * This is used for emergency situations
   */
  const forceEditModeOn = useCallback(() => {
    console.log("FORCING edit mode ON");

    // Set last action time
    lastActionTimeRef.current = Date.now();

    // Activate force lock
    forceLockRef.current = true;

    // Ensure we have an image selected
    if (!selectedImage && images.length > 0) {
      setSelectedImage(images[0]);
    }

    // Set transition flags to block other changes
    inTransitionRef.current = true;

    // Clear any existing timeout
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }

    // Force state update
    editModeRef.current = true;
    setIsEditModeState(true);

    // Start monitoring to ensure edit mode stays on
    const watchInterval = setInterval(() => {
      if (!editModeRef.current || !isEditMode) {
        console.log("Detected edit mode turned off, forcing back on");
        setIsEditModeState(true);
      }
    }, 100);

    // Release locks after a long enough period
    lockTimeoutRef.current = setTimeout(() => {
      inTransitionRef.current = false;

      // Clear the watch interval
      clearInterval(watchInterval);

      // Double-check the state before releasing force lock
      if (!editModeRef.current || !isEditMode) {
        console.log(
          "Final state check failed, forcing edit mode on one last time"
        );
        setIsEditModeState(true);
      }

      // Release force lock after another delay
      setTimeout(() => {
        forceLockRef.current = false;
        console.log("Force lock released");
      }, 1000);

      lockTimeoutRef.current = null;
    }, 2000);
  }, [images, selectedImage, isEditMode]);

  /**
   * Toggle edit mode with safety checks and throttling
   */
  const toggleEditMode = useCallback(() => {
    // Block if force locked
    if (forceLockRef.current) {
      console.log("Ignoring toggle during force lock");
      return;
    }

    // Prevent toggle during transition
    if (inTransitionRef.current) {
      console.log("Ignoring toggle during transition");
      return;
    }

    // Throttle rapid toggles
    if (isThrottled()) {
      console.log("Throttling rapid toggle");
      return;
    }

    console.log(
      `Toggling edit mode from ${
        editModeRef.current
      } to ${!editModeRef.current}`
    );
    setIsEditMode(!editModeRef.current);
  }, [setIsEditMode]);

  /**
   * Exit edit mode safely
   */
  const exitEditMode = useCallback(() => {
    // Block if force locked
    if (forceLockRef.current) {
      console.log("Ignoring exit during force lock");
      return;
    }

    // Prevent exit during transition
    if (inTransitionRef.current) {
      console.log("Ignoring exit during transition");
      return;
    }

    // Throttle rapid state changes
    if (isThrottled()) {
      console.log("Throttling rapid exit");
      return;
    }

    // Close all tool modes first
    setIsCropping(false);
    setIsBlurring(false);
    setIsPainting(false);
    setIsTexting(false);

    // Then exit edit mode
    setIsEditMode(false);
  }, [setIsEditMode]);

  // Synchronize state externally
  useEffect(() => {
    // If we're force locked, ensure edit mode is on
    if (forceLockRef.current && !isEditMode) {
      console.log("Force lock active but edit mode is off, correcting...");
      setIsEditModeState(true);
    }
  }, [isEditMode]);

  // Return all state and functions
  return {
    isEditMode,
    setIsEditMode,
    forceEditModeOn,
    isMultiEditMode,
    setIsMultiEditMode,
    selectedImage,
    setSelectedImage,
    isCropping,
    setIsCropping,
    isBlurring,
    setIsBlurring,
    isPainting,
    setIsPainting,
    isTexting,
    setIsTexting,
    isEraser,
    setIsEraser,
    toggleEditMode,
    exitEditMode,
    toggleCropping: () => setIsCropping(!isCropping),
    toggleBlurring: () => setIsBlurring(!isBlurring),
    togglePainting: () => setIsPainting(!isPainting),
    toggleTexting: () => setIsTexting(!isTexting),
    toggleEraser: () => setIsEraser(!isEraser),
    toggleMultiEditMode: () => setIsMultiEditMode(!isMultiEditMode),
    cancelCrop: () => setIsCropping(false),
    cancelBlur: () => setIsBlurring(false),
    cancelPaint: () => setIsPainting(false),
    cancelText: () => setIsTexting(false),
  };
}
