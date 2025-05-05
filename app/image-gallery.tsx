"use client";

import { useRef, useEffect, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  X,
  Upload,
  ImageIcon,
  Lock,
  Maximize2,
  Crop,
  Droplets,
  Paintbrush,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { imageDB } from "@/app/utils/indexedDB";
import { ImagePlaceholder, EmptyPlaceholder } from "./components/placeholder";
import {
  useImageStore,
  useImageActions,
  type ImageFile,
} from "@/store/useImageStore";
import { useFileOperations } from "@/store/hooks/useFileOperations";
import { useImageControls } from "@/store/hooks/useImageControls";

interface ImageGalleryProps {
  onSelectImage?: (image: ImageFile) => void;
  standalone?: boolean;
}

export default function ImageGallery({
  onSelectImage,
  standalone = false,
}: ImageGalleryProps) {
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Zustand state
  const {
    images,
    uploadComplete,
    newImageAdded,
    isUploading, // Change isLoading to isUploading
    isDragging,
    selectedImage,
    isEditMode,
    zoom, // Change zoomLevel to zoom
    isCropping,
    isBlurring,
    isPainting,
  } = useImageStore();

  // Actions
  const actions = useImageActions();

  // Custom hooks
  const fileOps = useFileOperations();
  const controls = useImageControls();

  // Load images on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const storedImages = await imageDB.getAllImages();
        if (storedImages?.length > 0) {
          actions.setImages(storedImages);
          actions.setUploadComplete(true);
        }
      } catch (error) {
        console.error("Error loading images:", error);
      }

      loadImages();

      // Cleanup URLs on unmount
      return () => {
        images.forEach((image) => {
          if (image.url) URL.revokeObjectURL(image.url);
        });
      };
    };
  }, []);

  // Handle file selection
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle edit image
  const handleEditImage = (image: ImageFile) => {
    router.push(`/image-editor/${image.id}`);
  };

  // Reset upload
  const handleResetUpload = async () => {
    try {
      await imageDB.deleteAllImages();
      actions.resetAll();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error clearing images:", error);
    }
  };

  if (isUploading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-300 rounded mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="aspect-square bg-gray-300 rounded"></div>
          <div className="aspect-square bg-gray-300 rounded"></div>
          <div className="aspect-square bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!uploadComplete) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <ImageIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Upload Images</CardTitle>
          <CardDescription>
            Drag & drop or click to upload images
          </CardDescription>
        </CardHeader>
        <CardContent
          className={`border-dashed border-2 border-gray-300 p-4 rounded-lg text-center ${
            isDragging ? "bg-gray-100" : ""
          }`}
          onDragEnter={fileOps.handleDragEnter}
          onDragOver={fileOps.handleDragOver}
          onDragLeave={fileOps.handleDragLeave}
          onDrop={fileOps.handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            ref={fileInputRef}
            onChange={fileOps.handleFileChange}
          />
          <EmptyPlaceholder
            icon={<Upload className="h-12 w-12" />}
            title="No images uploaded yet"
            description="Upload images by clicking the button below or drag and drop files here"
            className="py-8"
          >
            <Button onClick={handleUploadClick} className="mb-2">
              <Upload className="mr-2 h-4 w-4" /> Choose Files
            </Button>
            <p className="text-sm text-gray-500">
              You can also paste images from clipboard
            </p>
          </EmptyPlaceholder>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            variant="ghost"
            onClick={handleResetUpload}
            className="text-red-500"
          >
            Remove All
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (isEditMode && selectedImage) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
        <div className="space-y-6">
          {/* Thumbnail strip */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-2 bg-gray-800 rounded-lg opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top">
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <Lock className="h-6 w-6 text-white opacity-70" />
              <span className="ml-2 text-white text-sm opacity-70">
                Editing Mode Active
              </span>
            </div>

            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group aspect-square animate-fade-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Image
                  src={image.url}
                  alt="Uploaded image"
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                    aria-label="Expand image"
                    disabled
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
                <button
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                  disabled
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="space-y-6">
              {/* Image editing toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-2">
                    <Button onClick={controls.zoomOut} variant="outline">
                      <span className="text-lg">-</span>
                    </Button>
                    <Button onClick={controls.zoomIn} variant="outline">
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                  <Button onClick={controls.toggleCropping} variant="outline">
                    <Crop className="mr-2 h-4 w-4" />
                    Crop Image
                  </Button>
                  <Button onClick={controls.toggleBlurring} variant="outline">
                    <Droplets className="mr-2 h-4 w-4" />
                    Blur Tool
                  </Button>
                  <Button onClick={controls.togglePainting} variant="outline">
                    <Paintbrush className="mr-2 h-4 w-4" />
                    Paint Tool
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => actions.setIsEditMode(false)}
                    variant="default"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Exit Edit Mode
                  </Button>
                </div>
              </div>

              {/* Image editor area */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <section className="col-span-1">
                    <div className="space-y-2">
                      <div className="relative border rounded-lg overflow-hidden">
                        <div
                          className="overflow-auto"
                          style={{ maxHeight: "85vh", height: "85vh" }}
                        >
                          <img
                            src={selectedImage.url}
                            alt="Edited image"
                            className="max-w-full transform origin-top-left"
                            style={{ transform: `scale(${zoom})` }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card
          key={image.id}
          className={`group relative overflow-hidden polaroid-card ${
            image.isNew ? "polaroid-new" : ""
          } cursor-pointer`}
        >
          <div className="relative aspect-square w-full">
            <Image
              src={image.url}
              alt={image.file.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmUyZTIiLz48L3N2Zz4="
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlaceholder className="w-full h-full" />
            </div>
          </div>
          <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 truncate px-2">
            {image.file.name}
          </div>
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="default"
              size="icon"
              className="p-1 bg-blue-500 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                handleEditImage(image);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="p-1 bg-red-500 text-white rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                actions.removeImage(image.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
