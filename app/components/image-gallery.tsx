"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  Maximize2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Upload,
  Trash2,
  Users,
  WandSparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ImageGalleryProps } from "@/types/editor";

export default function EnhancedImageGallery({
  images,
  onSelectImage,
  onRemoveImage,
  onUploadNew,
  onRemoveAll,
  currentPage,
  totalPages,
  onPageChange,
  isGalleryMinimized = false,
  newImageAdded = false,
  onToggleEditMode,
  onToggleMultiEditMode,
}: ImageGalleryProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Only render client-side to avoid hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-16 w-full bg-gray-800 rounded-lg animate-pulse"></div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Control buttons */}
      {!isGalleryMinimized && (
        <div className="flex items-center justify-between mb-4 bg-gray-700 p-2 rounded-lg">
          <div className="flex items-center gap-2">
            <Button onClick={onToggleEditMode} variant="outline">
              <WandSparkles className="mr-2 h-4 w-4" />
              Edit Image
            </Button>
            <Button onClick={onToggleMultiEditMode} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Multi Edit
              <span className="text-xs ml-1 opacity-70">(Coming Soon)</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onUploadNew} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload More
            </Button>
            <Button onClick={onRemoveAll} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove All
            </Button>
          </div>
        </div>
      )}

      {/* Image Gallery Grid */}
      <div
        className={`
          grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg 
          ${newImageAdded ? "animate-pulse-once" : ""} 
          ${
            isGalleryMinimized
              ? "opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top"
              : "transition-all duration-300"
          }
        `}
      >
        {isGalleryMinimized ? (
          // When in edit mode, show only the container with the "Editing Mode Active" message
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Lock className="h-6 w-6 text-white opacity-70" />
            <span className="ml-2 text-white text-sm opacity-90">
              Editing Mode Active
            </span>
          </div>
        ) : (
          // When not in edit mode, show the images
          <>
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-square animate-fade-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt="Uploaded image"
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => onSelectImage(image)}
                    className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                    aria-label="Edit image"
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
                <button
                  onClick={() => onRemoveImage(image.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Show pagination controls if there are multiple pages */}
            {!isGalleryMinimized && totalPages > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 p-1 bg-black bg-opacity-70 rounded">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPageChange(1)}
                  disabled={currentPage === 1}
                  className="h-6 w-6 p-1"
                >
                  <ChevronsLeft className="h-3 w-3 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-6 w-6 p-1"
                >
                  <ChevronLeft className="h-3 w-3 text-white" />
                </Button>
                <span className="mx-1 text-xs text-white">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-6 w-6 p-1"
                >
                  <ChevronRight className="h-3 w-3 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-6 w-6 p-1"
                >
                  <ChevronsRight className="h-3 w-3 text-white" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
