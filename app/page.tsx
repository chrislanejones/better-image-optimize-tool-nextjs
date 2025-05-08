"use client";

// Import the updated components
import React, { useState, useEffect } from "react";
import Image from "next/image";
import MultiImageEditor from "./multi-editor";
import {
  Lock,
  Maximize2,
  Trash2,
  Upload,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { imageDB } from "./utils/indexedDB";
import { type ImageFile, type ImageStats } from "@/types/editor";
import ImageUploader from "./components/image-uploader";
import ImageControls from "./components/image-controls";
import ImageResizer from "./components/image-resizer";
import ImageZoomView from "./components/image-zoom-view";
import ImageStatsComponent from "./components/image-stats";

// Constants for pagination
const IMAGES_PER_PAGE = 10;
const MAX_IMAGES = 50;

export default function HomePage() {
  // State for managing images and UI
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [newImageAdded, setNewImageAdded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMultiEditMode, setIsMultiEditMode] = useState(false);
  const [isGalleryMinimized, setIsGalleryMinimized] = useState(false);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [format, setFormat] = useState<string>("jpeg");
  const [hasEdited, setHasEdited] = useState<boolean>(false);
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null);
  const [newStats, setNewStats] = useState<ImageStats | null>(null);
  const [dataSavings, setDataSavings] = useState(0);
  const [zoom, setZoom] = useState<number>(1);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Initialize image statistics when an image is selected
  useEffect(() => {
    if (!selectedImage || !isMounted) return;

    // Get image dimensions - use global window.Image instead of imported Image
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setWidth(img.width);
      setHeight(img.height);

      // Set original stats with safe values
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: selectedImage && selectedImage.file ? selectedImage.file.size : 0,
        format:
          selectedImage && selectedImage.file && selectedImage.file.type
            ? selectedImage.file.type.split("/")[1]
            : "unknown",
      } as ImageStats);
    };

    // Set a safe image source
    img.src = selectedImage.url;
  }, [selectedImage, isMounted]);

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
  const handleSelectImage = (image: ImageFile) => {
    setSelectedImage(image);
    setIsEditMode(false);
    setIsMultiEditMode(false);
    setIsGalleryMinimized(false);
    setHasEdited(false);
    setNewStats(null);
  };

  // Toggle advanced edit mode
  const handleToggleEditMode = () => {
    if (selectedImage) {
      setIsEditMode(true);
      setIsGalleryMinimized(true);
    } else if (images.length > 0) {
      // Select the first image when entering edit mode
      setSelectedImage(images[0]);
      setIsEditMode(true);
      setIsGalleryMinimized(true);
    }
  };

  // Toggle multi-edit mode
  const handleToggleMultiEditMode = () => {
    setIsMultiEditMode(true);
    setIsEditMode(false);
    setIsGalleryMinimized(true);

    // Select the first image if none is selected
    if (!selectedImage && images.length > 0) {
      setSelectedImage(images[0]);
    }
  };

  // Handle image removal
  const handleRemoveImage = async (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url) URL.revokeObjectURL(imageToRemove.url);

    setImages(images.filter((img) => img.id !== id));

    try {
      await imageDB.deleteImage(id);
    } catch (error) {
      console.error("Error deleting image:", error);
    }

    // If we're removing the selected image, clear the selection
    if (selectedImage?.id === id) {
      setSelectedImage(null);
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
    // Revoke all object URLs
    images.forEach((image) => {
      if (image.url) URL.revokeObjectURL(image.url);
    });

    setImages([]);
    setUploadComplete(false);
    setSelectedImage(null);
    setIsEditMode(false);
    setIsMultiEditMode(false);
    setCurrentPage(1);

    try {
      await imageDB.deleteAllImages();
    } catch (error) {
      console.error("Error clearing image database:", error);
    }
  };

  // Handle page change for pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle uploading more images
  const handleUploadMore = () => {
    // We don't exit view mode, just allow more image uploads
  };

  // Handle resizing the selected image
  const handleResize = (newWidth: number, newHeight: number) => {
    setWidth(newWidth);
    setHeight(newHeight);
  };

  // Apply resize to the image
  const applyResize = async () => {
    if (!selectedImage) return;

    try {
      // Create a canvas to resize the image
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      // Create an image element
      const img = new window.Image();
      img.crossOrigin = "anonymous";

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = selectedImage.url;
      });

      // Draw the image at the new size
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
          },
          `image/${
            format === "jpeg" ? "jpeg" : format === "webp" ? "webp" : "png"
          }`,
          0.9
        );
      });

      // Create a URL for the blob
      const resizedUrl = URL.createObjectURL(blob);

      // Update stats
      setNewStats({
        width,
        height,
        size: blob.size,
        format: format || "unknown",
      } as ImageStats);

      // Calculate data savings
      if (originalStats && originalStats.size > 0) {
        const savings = 100 - (blob.size / originalStats.size) * 100;
        setDataSavings(savings);
      }

      // Update the selected image URL
      setSelectedImage({
        ...selectedImage,
        url: resizedUrl,
      });

      setHasEdited(true);
    } catch (error) {
      console.error("Error resizing image:", error);
    }
  };

  // Zoom in/out functions
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Exit both edit modes
  const exitEditMode = () => {
    setIsEditMode(false);
    setIsMultiEditMode(false);
    setIsGalleryMinimized(false);
  };

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
      {/* Image uploader shown when no images have been uploaded - centered */}
      {!uploadComplete && (
        <div className="flex justify-center items-center flex-1">
          <ImageUploader
            onImagesUploaded={handleImagesUploaded}
            maxImages={MAX_IMAGES}
          />
        </div>
      )}

      {/* When images are uploaded... */}
      {uploadComplete && (
        <div className="space-y-6">
          {/* Image Gallery - always at the top unless in Edit Mode */}
          {isEditMode || isMultiEditMode ? (
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Lock className="h-6 w-6 text-white opacity-70" />
                <span className="ml-2 text-white text-sm opacity-90">
                  Editing Mode Active
                </span>
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
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt="Uploaded image"
                      fill
                      className={`object-cover rounded-md ${
                        selectedImage?.id === image.id
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
                        <Maximize2 size={20} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Main content area based on current state */}
          {isEditMode && selectedImage ? (
            // Full edit mode with proper controls
            <div className="space-y-6">
              {/* Use ImageControls component properly */}
              <ImageControls
                isEditMode={true}
                isCropping={false}
                isBlurring={false}
                isPainting={false}
                isTexting={false}
                isEraser={false}
                format={format}
                onFormatChange={setFormat}
                onToggleEditMode={() => {}}
                onToggleCropping={() => {}}
                onToggleBlurring={() => {}}
                onTogglePainting={() => {}}
                onToggleTexting={() => {}}
                onToggleEraser={() => {}}
                onApplyCrop={() => {}}
                onApplyBlur={() => {}}
                onApplyPaint={() => {}}
                onApplyText={() => {}}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={() => {}}
                onDownload={() => {}}
                onUploadNew={() => {}}
                onRemoveAll={() => {}}
                onCancelBlur={() => {}}
                onCancelCrop={() => {}}
                onCancelPaint={() => {}}
                onCancelText={() => {}}
                onBackToGallery={() => {}}
                onExitEditMode={exitEditMode}
                onToggleMultiEditMode={() => {}}
              />

              {/* Edit Mode Content */}
              <div className="relative border rounded-lg overflow-hidden">
                <div
                  className="overflow-auto"
                  style={{ maxHeight: "700px", height: "70vh" }}
                >
                  {selectedImage && (
                    <img
                      src={selectedImage.url || "/placeholder.svg"}
                      alt="Image being edited"
                      className="max-w-full transform origin-center"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : isMultiEditMode ? (
            // Multi-edit mode
            <MultiImageEditor
              images={images}
              onUploadNew={handleUploadMore}
              onRemoveAll={handleRemoveAll}
              onBackToGallery={exitEditMode}
              selectedImageId={selectedImage?.id}
            />
          ) : selectedImage ? (
            // Basic view mode with selected image
            <div className="space-y-6">
              {/* Use ImageControls component for normal view */}
              <ImageControls
                isEditMode={false}
                isCropping={false}
                isBlurring={false}
                isPainting={false}
                isTexting={false}
                isEraser={false}
                format={format}
                onFormatChange={setFormat}
                onToggleEditMode={handleToggleEditMode}
                onToggleCropping={() => {}}
                onToggleBlurring={() => {}}
                onTogglePainting={() => {}}
                onToggleTexting={() => {}}
                onToggleEraser={() => {}}
                onApplyCrop={() => {}}
                onApplyBlur={() => {}}
                onApplyPaint={() => {}}
                onApplyText={() => {}}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onReset={() => {}}
                onDownload={() => {
                  if (!selectedImage) return;

                  // Create a download link
                  const a = document.createElement("a");
                  a.href = selectedImage.url;
                  a.download = `${
                    selectedImage.file.name.split(".")[0]
                  }-resized.${format === "jpeg" ? "jpg" : format}`;
                  a.click();
                }}
                onUploadNew={handleUploadMore}
                onRemoveAll={handleRemoveAll}
                onToggleMultiEditMode={handleToggleMultiEditMode}
                onCancelBlur={() => {}}
                onCancelCrop={() => {}}
                onCancelPaint={() => {}}
                onCancelText={() => {}}
                onBackToGallery={() => {}}
                onExitEditMode={() => {}}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
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
                        {selectedImage && (
                          <img
                            src={selectedImage.url || "/placeholder.svg"}
                            alt="Selected image"
                            className="max-w-full transform origin-center"
                            style={{ transform: `scale(${zoom})` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Sidebar with tools */}
                <aside className="md:col-span-1 space-y-6">
                  <ImageResizer
                    width={width}
                    height={height}
                    maxWidth={originalStats?.width || 1000}
                    maxHeight={originalStats?.height || 1000}
                    onResize={handleResize}
                    onApplyResize={applyResize}
                    format={format}
                    onFormatChange={setFormat}
                    onDownload={() => {
                      if (!selectedImage) return;

                      // Create a download link
                      const a = document.createElement("a");
                      a.href = selectedImage.url;
                      a.download = `${
                        selectedImage.file.name.split(".")[0]
                      }-resized.${format === "jpeg" ? "jpg" : format}`;
                      a.click();
                    }}
                  />

                  <ImageZoomView imageUrl={selectedImage?.url} />
                </aside>
              </div>

              {/* Image Information Cards */}
              <ImageStatsComponent
                originalStats={originalStats}
                newStats={newStats}
                dataSavings={dataSavings}
                hasEdited={hasEdited}
                fileName={selectedImage?.file?.name || "image.png"}
                format={format}
                fileType={selectedImage?.file?.type || "image/png"}
              />
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
