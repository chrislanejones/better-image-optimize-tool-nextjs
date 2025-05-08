"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  X,
  Maximize2,
  Upload,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import { type ImageGalleryProps } from "@/types/editor";

export default function ImageGallery({
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
}: ImageGalleryProps) {
  // If gallery is minimized, show the minimized view
  if (isGalleryMinimized) {
    return (
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top">
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Lock className="h-6 w-6 text-white opacity-70" />
          <span className="ml-2 text-white text-sm opacity-90">
            Editing Mode Active
          </span>
        </div>
      </div>
    );
  }

  // If there are no images, show a message
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center p-12 text-center">
        <div className="max-w-md">
          <Info className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">No images available</h3>
          <p className="text-muted-foreground">
            Upload images to get started with editing and optimization.
          </p>
          <div className="mt-4">
            <Button onClick={onUploadNew}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Image grid */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 ${
          newImageAdded ? "animate-pulse-once" : ""
        }`}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`relative group aspect-square animate-fade-scale-in ${
              image.isNew ? "polaroid-new" : ""
            }`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <Image
              src={image.url}
              alt={`Uploaded image ${index + 1}`}
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
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(image.id);
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Pagination and action buttons */}
      <div className="flex flex-wrap items-center justify-between mt-4">
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-9 w-9"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="mx-2 text-sm">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-9 w-9"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
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
    </div>
  );
}
