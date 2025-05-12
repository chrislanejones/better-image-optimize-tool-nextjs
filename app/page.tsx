"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { imageDB } from "./utils/indexedDB";
import { type ImageFile } from "@/types/editor";
import ImageUploader from "./components/image-uploader";
import ImageControls from "./components/image-controls";
import ImageResizer from "./components/image-resizer";
import ImageZoomView from "./components/image-zoom-view";
import ImageStatsComponent from "./components/image-stats";
import { useEditMode } from "@/hooks/use-edit-mode";
import { useImageProcessing } from "@/hooks/use-image-processing";
import EmergencyEditButton from "./components/emergency-edit-button";

// Define global type for emergency edit mode function
declare global {
  interface Window {
    __EMERGENCY_EDIT_MODE?: () => void;
  }
}

// Dynamically import the MultiImageEditor component
const MultiImageEditor = dynamic(() => import("./multi-editor"), {
  ssr: false,
});

// Dynamically import the ImageEditor component
const ImageEditor = dynamic(() => import("./image-editor"), {
  ssr: false,
});

// Constants for pagination
const IMAGES_PER_PAGE = 10;
const MAX_IMAGES = 50;

export default function HomePage() {
  // Basic state
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [newImageAdded, setNewImageAdded] = useState(false);

  // Track if we're in emergency mode to prevent interruptions
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);

  // Get edit mode functionality from custom hook
  const editMode = useEditMode(images);

  // Get image processing functionality from custom hook
  const imageProcessing = useImageProcessing(editMode.selectedImage, false);

  // Crop related refs
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const completedCrop = useRef(null);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add global handler for emergency edit mode
  useEffect(() => {
    // Function to handle emergency edit mode
    const handleEmergencyEditMode = () => {
      console.log("EMERGENCY EDIT MODE ACTIVATED");

      // Set emergency mode flag
      setIsEmergencyMode(true);

      // Ensure we have an image selected
      if (!editMode.selectedImage && images.length > 0) {
        console.log("Setting selected image in emergency mode");
        editMode.setSelectedImage(images[0]);
      }

      // Use the hook's protected force function instead of regular state change
      editMode.forceEditModeOn();

      // Monitor the edit mode to keep it on for a period
      const checkCount = { current: 0 };
      const maxChecks = 20; // 4 seconds maximum (20 * 200ms)

      const intervalId = setInterval(() => {
        checkCount.current++;

        if (!editMode.isEditMode) {
          console.log(
            "EMERGENCY OVERRIDE: Edit mode was turned off, forcing back on"
          );
          editMode.forceEditModeOn();
        }

        // Stop checking after max attempts
        if (checkCount.current >= maxChecks) {
          clearInterval(intervalId);
          setIsEmergencyMode(false);
          console.log("Emergency mode monitoring completed");
        }
      }, 200);

      // Clear the emergency mode after a fixed timeout
      setTimeout(() => {
        clearInterval(intervalId);
        setIsEmergencyMode(false);
        console.log("Emergency mode timeout completed");
      }, 4000);
    };

    // Register this as a global function
    window.__EMERGENCY_EDIT_MODE = handleEmergencyEditMode;

    return () => {
      // Clean up
      delete window.__EMERGENCY_EDIT_MODE;
    };
  }, [editMode, images]);

  // Ensure edit button works reliably with protection against interruption
  const handleEditButtonClick = useCallback(() => {
    console.log("Edit button click handler in page.tsx");

    // If we're in emergency mode, use the force function
    if (isEmergencyMode) {
      console.log("Using emergency force method");
      editMode.forceEditModeOn();
      return;
    }

    // Make sure we have an image selected
    if (!editMode.selectedImage && images.length > 0) {
      editMode.setSelectedImage(images[0]);
    }

    // Call the toggle function directly after ensuring an image is selected
    editMode.toggleEditMode();
  }, [editMode, images, isEmergencyMode]);

  // Block any action that would exit edit mode during emergency mode
  useEffect(() => {
    if (isEmergencyMode) {
      // Force edit mode on whenever emergency mode is active
      if (!editMode.isEditMode) {
        console.log("Emergency mode is active - enforcing edit mode");
        editMode.forceEditModeOn();
      }
    }
  }, [isEmergencyMode, editMode]);

  // Handler for edit mode changes coming from child components
  const handleEditModeChange = useCallback(
    (newEditMode: boolean) => {
      console.log("handleEditModeChange called with:", newEditMode);

      // Block turning off edit mode during emergency mode
      if (isEmergencyMode && !newEditMode) {
        console.log("BLOCKED: Cannot turn off edit mode during emergency");
        return;
      }

      // Process edit mode change from child component
      if (newEditMode) {
        // Make sure we have an image selected
        if (!editMode.selectedImage && images.length > 0) {
          editMode.setSelectedImage(images[0]);
        }
        editMode.setIsEditMode(true);
      } else {
        editMode.exitEditMode();
      }
    },
    [editMode, images, isEmergencyMode]
  );

  // Load images from IndexedDB on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const storedImages = await imageDB.getAllImages();
        if (storedImages && storedImages.length > 0) {
          setImages(storedImages);
          setUploadComplete(true);
        } else {
          setUploadComplete(false);
        }
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isMounted) loadImages();

    // Clean up object URLs when component unmounts
    return () => {
      images.forEach((image) => {
        if (image.url) URL.revokeObjectURL(image.url);
      });
    };
  }, [isMounted]);

  // Callback when images are uploaded
  const handleImagesUploaded = (newImages: ImageFile[]) => {
    setImages((prev) => [...prev, ...newImages]);
    setUploadComplete(true);
    setNewImageAdded(true);

    // If we're adding images and not on the last page, go to the last page
    if (images.length + newImages.length > currentPage * IMAGES_PER_PAGE) {
      const newTotalPages = Math.ceil(
        (images.length + newImages.length) / IMAGES_PER_PAGE
      );
      setCurrentPage(newTotalPages);
    }

    // Reset the newImageAdded flag after animation
    setTimeout(() => {
      setNewImageAdded(false);
      setImages((prevImages) =>
        prevImages.map((img) => ({ ...img, isNew: false }))
      );
    }, 1500);
  };

  // Handle image selection for viewing/basic editing
  const handleSelectImage = useCallback(
    (image: ImageFile) => {
      // Block changes during emergency mode
      if (isEmergencyMode) return;

      editMode.setSelectedImage(image);
      editMode.setIsEditMode(false);
      editMode.exitEditMode();
    },
    [editMode, isEmergencyMode]
  );

  // Handle image removal
  const handleRemoveImage = async (id: string) => {
    // Block changes during emergency mode
    if (isEmergencyMode) return;

    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url) URL.revokeObjectURL(imageToRemove.url);

    setImages(images.filter((img) => img.id !== id));

    try {
      await imageDB.deleteImage(id);
    } catch (error) {
      console.error("Error deleting image:", error);
    }

    // If we're removing the selected image, clear the selection
    if (editMode.selectedImage?.id === id) {
      editMode.setSelectedImage(null);
    }

    // Update pagination if needed
    const newImagesLength = images.filter((image) => image.id !== id).length;
    const newTotalPages = Math.ceil(newImagesLength / IMAGES_PER_PAGE);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }

    if (newImagesLength === 0) {
      setUploadComplete(false);
    }
  };

  // Handle clearing all images
  const handleRemoveAll = async () => {
    // Block changes during emergency mode
    if (isEmergencyMode) return;

    // Revoke all object URLs
    images.forEach((image) => {
      if (image.url) URL.revokeObjectURL(image.url);
    });

    setImages([]);
    setUploadComplete(false);
    editMode.setSelectedImage(null);
    editMode.exitEditMode();
    setCurrentPage(1);

    try {
      await imageDB.deleteAllImages();
    } catch (error) {
      console.error("Error clearing image database:", error);
    }
  };

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    // Block changes during emergency mode
    if (isEmergencyMode) return;

    setCurrentPage(page);
  };

  // Force edit mode handler for emergency button
  const handleForceEditMode = useCallback(() => {
    console.log("Force edit mode called from emergency button");

    // Ensure we have an image selected
    if (!editMode.selectedImage && images.length > 0) {
      editMode.setSelectedImage(images[0]);
    }

    // Force edit mode on
    editMode.forceEditModeOn();
  }, [editMode, images]);

  // Don't render until client-side
  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-64 w-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Render the main interface
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Add the emergency edit button if needed */}
      {!editMode.isEditMode && (
        <EmergencyEditButton
          selectedImage={editMode.selectedImage}
          images={images}
          onForceEditMode={handleForceEditMode}
          onSelectImage={editMode.setSelectedImage}
        />
      )}

      {/* Show emergency mode indicator */}
      {isEmergencyMode && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            backgroundColor: "rgba(255, 0, 0, 0.8)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          EMERGENCY MODE ACTIVE
        </div>
      )}

      {/* Image uploader shown when no images have been uploaded - centered */}
      {!uploadComplete && (
        <div className="flex justify-center items-center flex-1">
          <div className="w-full max-w-md">
            <ImageUploader
              onImagesUploaded={handleImagesUploaded}
              maxImages={MAX_IMAGES}
            />
          </div>
        </div>
      )}

      {/* When images are uploaded... */}
      {uploadComplete && (
        <div className="space-y-6">
          {/* Image Gallery - always at the top unless in Edit Mode */}
          {editMode.isEditMode || editMode.isMultiEditMode ? (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                {editMode.isMultiEditMode ? (
                  <>
                    <span className="ml-2 text-white text-sm opacity-90">
                      Multi-editing Mode Active
                    </span>
                  </>
                ) : (
                  <>
                    <span className="ml-2 text-white text-sm opacity-90">
                      Editing Mode Active
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg">
              {images
                .slice(
                  (currentPage - 1) * IMAGES_PER_PAGE,
                  currentPage * IMAGES_PER_PAGE
                )
                .map((image, index) => (
                  <div
                    key={image.id}
                    className="relative group aspect-square animate-fade-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt="Uploaded image"
                      className={`object-cover rounded-md w-full h-full ${
                        editMode.selectedImage?.id === image.id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => handleSelectImage(image)}
                        className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                        aria-label="View image"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <polyline points="9 21 3 21 3 15"></polyline>
                          <line x1="21" y1="3" x2="14" y2="10"></line>
                          <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}

              {/* Gallery controls */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                {totalPages > 1 && (
                  <div className="flex items-center gap-1 p-1 bg-black bg-opacity-70 rounded">
                    <span className="mx-1 text-xs text-white">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => {
                    /* Handle upload button click */
                  }}
                  variant="outline"
                  size="sm"
                >
                  Upload More
                </Button>
                <Button
                  onClick={handleRemoveAll}
                  variant="destructive"
                  size="sm"
                >
                  Remove All
                </Button>
              </div>
            </div>
          )}

          {/* Main content area based on current state */}
          {editMode.isEditMode && editMode.selectedImage ? (
            // Full edit mode with proper controls
            <ImageEditor
              image={editMode.selectedImage}
              onUploadNew={() => {}} // Add proper handler
              onRemoveAll={handleRemoveAll}
              onBackToGallery={editMode.exitEditMode}
              onEditModeChange={handleEditModeChange} // Use our improved handler
            />
          ) : editMode.isMultiEditMode ? (
            // Multi-edit mode
            <MultiImageEditor
              images={images}
              onUploadNew={() => {}} // Add proper handler
              onRemoveAll={handleRemoveAll}
              onBackToGallery={editMode.exitEditMode}
              selectedImageId={editMode.selectedImage?.id || ""}
            />
          ) : editMode.selectedImage ? (
            // Basic view mode with selected image
            <div className="space-y-6">
              {/* Use ImageControls component for normal view */}
              <ImageControls
                isEditMode={editMode.isEditMode}
                isCropping={editMode.isCropping}
                isBlurring={editMode.isBlurring}
                isPainting={editMode.isPainting}
                isTexting={editMode.isTexting}
                isEraser={editMode.isEraser}
                format={imageProcessing.format}
                onFormatChange={imageProcessing.setFormat}
                onToggleEditMode={handleEditButtonClick} // Use our stable handler
                onToggleCropping={editMode.toggleCropping}
                onToggleBlurring={editMode.toggleBlurring}
                onTogglePainting={editMode.togglePainting}
                onToggleTexting={editMode.toggleTexting}
                onToggleEraser={editMode.toggleEraser}
                onApplyCrop={() => {
                  if (completedCrop.current && cropImgRef.current) {
                    imageProcessing.applyCrop(
                      completedCrop.current,
                      cropImgRef.current
                    );
                  }
                }}
                onApplyBlur={() => {
                  // Add proper handler
                }}
                onApplyPaint={() => {
                  // Add proper handler
                }}
                onApplyText={() => {
                  // Add proper handler
                }}
                onZoomIn={imageProcessing.zoomIn}
                onZoomOut={imageProcessing.zoomOut}
                onReset={imageProcessing.resetImage}
                onDownload={imageProcessing.downloadImage}
                onUploadNew={() => {}} // Add proper handler
                onRemoveAll={handleRemoveAll}
                onCancelBlur={editMode.cancelBlur}
                onCancelCrop={editMode.cancelCrop}
                onCancelPaint={editMode.cancelPaint}
                onCancelText={editMode.cancelText}
                onExitEditMode={editMode.exitEditMode}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onToggleMultiEditMode={editMode.toggleMultiEditMode}
              />

              {/* Main content grid - image + sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Main image preview */}
                <section className="md:col-span-3">
                  <div className="space-y-2">
                    <div className="relative border rounded-lg overflow-hidden">
                      <div
                        className="overflow-auto"
                        style={{ maxHeight: "700px", height: "70vh" }}
                      >
                        {editMode.selectedImage && (
                          <img
                            ref={imageProcessing.imgRef}
                            src={
                              imageProcessing.previewUrl || "/placeholder.svg"
                            }
                            alt="Selected image"
                            className="max-w-full transform origin-center"
                            style={{
                              transform: `scale(${imageProcessing.zoom})`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sidebar with tools */}
                <aside className="md:col-span-1 space-y-6">
                  <ImageResizer
                    width={imageProcessing.width}
                    height={imageProcessing.height}
                    maxWidth={imageProcessing.originalStats?.width || 1000}
                    maxHeight={imageProcessing.originalStats?.height || 1000}
                    onResize={imageProcessing.handleResize}
                    onApplyResize={imageProcessing.applyResize}
                    format={imageProcessing.format}
                    onFormatChange={imageProcessing.setFormat}
                    onDownload={imageProcessing.downloadImage}
                  />

                  {imageProcessing.hasEdited && (
                    <ImageZoomView imageUrl={imageProcessing.previewUrl} />
                  )}
                </aside>
              </div>

              {/* Image Information Cards */}
              <ImageStatsComponent
                originalStats={imageProcessing.originalStats}
                newStats={imageProcessing.newStats}
                dataSavings={imageProcessing.dataSavings}
                hasEdited={imageProcessing.hasEdited}
                fileName={editMode.selectedImage?.file?.name || "image.png"}
                format={imageProcessing.format}
                fileType={editMode.selectedImage?.file?.type || "image/png"}
              />

              {/* Hidden canvas for image processing */}
              <canvas ref={imageProcessing.canvasRef} className="hidden" />
            </div>
          ) : (
            // No image selected - just show a prompt
            <div className="flex items-center justify-center p-12 text-center">
              <div>
                <h3 className="text-xl font-medium mb-2">
                  Select an image to view
                </h3>
                <p className="text-muted-foreground mb-4">
                  Click on any image in the gallery above to view and edit it.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
