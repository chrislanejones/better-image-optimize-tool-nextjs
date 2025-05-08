"use client";

import React, { useState, useEffect } from "react";
import ImageUploader from "./components/image-uploader";
import ImageGallery from "./components/image-gallery";
import ImageEditor from "./image-editor";
import { Button } from "@/components/ui/button";
import { Paintbrush, Layers } from "lucide-react";
import { imageDB } from "./utils/indexedDB";
import { type ImageFile } from "@/types/editor";

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

  // Handle image selection for editing
  const handleSelectImage = (image: ImageFile) => {
    setSelectedImage(image);
    setIsEditMode(true);
    setIsGalleryMinimized(true);
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
      setIsEditMode(false);
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
      URL.revokeObjectURL(image.url);
    });

    setImages([]);
    setUploadComplete(false);
    setSelectedImage(null);
    setIsEditMode(false);
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
    // Exit edit mode if active
    setIsEditMode(false);
    setSelectedImage(null);
    setIsGalleryMinimized(false);
  };

  // Handle edit mode change
  const handleEditModeChange = (isEditing: boolean) => {
    setIsGalleryMinimized(isEditing);
  };

  // Don't render until client-side
  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
        <div className="h-64 w-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Render the main interface
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Image Editor</h1>
        <p className="text-muted-foreground">
          Upload, edit, and optimize your images. Supports JPEG, PNG, and WebP
          formats.
        </p>

        {uploadComplete && !isEditMode && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsMultiEditMode(false)}
              disabled={!isMultiEditMode}
            >
              <Paintbrush className="mr-2 h-4 w-4" />
              Single Image Editor
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsMultiEditMode(true)}
              disabled={isMultiEditMode}
            >
              <Layers className="mr-2 h-4 w-4" />
              Multi-Image Editor
              <span className="ml-2 text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                Soon
              </span>
            </Button>
          </div>
        )}
      </div>

      {/* Image uploader shown when no images have been uploaded */}
      {!uploadComplete && (
        <ImageUploader
          onImagesUploaded={handleImagesUploaded}
          maxImages={MAX_IMAGES}
        />
      )}

      {/* Image Gallery shown when images are uploaded and not in edit mode */}
      {uploadComplete && !isEditMode && (
        <ImageGallery
          images={images.slice(
            (currentPage - 1) * IMAGES_PER_PAGE,
            currentPage * IMAGES_PER_PAGE
          )}
          onSelectImage={handleSelectImage}
          onRemoveImage={handleRemoveImage}
          onUploadNew={handleUploadMore}
          onRemoveAll={handleRemoveAll}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isGalleryMinimized={isGalleryMinimized}
          newImageAdded={newImageAdded}
        />
      )}

      {/* Image Editor shown when an image is selected */}
      {selectedImage && isEditMode && (
        <ImageEditor
          image={selectedImage}
          onUploadNew={handleUploadMore}
          onRemoveAll={handleRemoveAll}
          onBackToGallery={() => {
            setIsEditMode(false);
            setSelectedImage(null);
            setIsGalleryMinimized(false);
          }}
          onEditModeChange={handleEditModeChange}
        />
      )}

      {/* Multi-image editor placeholder (coming soon) */}
      {isMultiEditMode && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-md">
            <Layers className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              Multi-Image Editor Coming Soon
            </h3>
            <p className="text-muted-foreground mb-4">
              This feature will allow you to edit multiple images at once with
              batch operations.
            </p>
            <Button onClick={() => setIsMultiEditMode(false)}>
              Go Back to Single Image Editor
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
