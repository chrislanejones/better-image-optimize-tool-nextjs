"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import ImageCropper from "@/app/image-cropper";
// Add these imports at the top of your ImageEditor.tsx file
import {
  Pencil,
  Info,
  Download,
  Upload,
  X,
  Maximize2,
  Lock,
  Crop,
  Droplets,
  Paintbrush,
  Minus,
  Plus,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageFile {
  id: string;
  file: File;
  url: string;
  isNew?: boolean;
}

export default function EnhancedImageEditor() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track animation states
  const [sidebarExiting, setSidebarExiting] = useState(false);
  const [canvasExpanding, setCanvasExpanding] = useState(false);
  const [bottomBarExiting, setBottomBarExiting] = useState(false);

  // Simulate fetching images on mount
  useEffect(() => {
    // This would be your actual data fetching code
    setTimeout(() => {
      // Mock data
      setImages([
        // Your images would be loaded here
      ]);
      setUploadComplete(true);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Handle the animation sequences when edit mode changes
  useEffect(() => {
    if (isEditMode) {
      // Start the exit animations
      setSidebarExiting(true);
      setBottomBarExiting(true);

      // Delay the canvas animation slightly
      setTimeout(() => {
        setCanvasExpanding(true);
      }, 200);
    } else {
      // Reverse the animations
      setCanvasExpanding(false);

      // Delay the entrance animations slightly
      setTimeout(() => {
        setSidebarExiting(false);
        setBottomBarExiting(false);
      }, 100);
    }
  }, [isEditMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Process files
    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isNew: true,
      }));

    setImages((prev) => [...prev, ...newImages]);
    setUploadComplete(true);

    // Clear the isNew flag after animation
    setTimeout(() => {
      setImages((images) => images.map((img) => ({ ...img, isNew: false })));
    }, 1000);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const removeImage = (id: string) => {
    // Revoke object URL to prevent memory leaks
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url) URL.revokeObjectURL(imageToRemove.url);

    setImages(images.filter((img) => img.id !== id));
    if (selectedImage?.id === id) setSelectedImage(null);
    if (images.length <= 1) setUploadComplete(false);
  };

  const selectImage = (image: ImageFile) => {
    setSelectedImage(image);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-gray-300 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="aspect-square bg-gray-300 rounded"></div>
            <div className="aspect-square bg-gray-300 rounded"></div>
            <div className="aspect-square bg-gray-300 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          {!uploadComplete ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md shadow-lg p-6 rounded-lg border bg-card">
                <div className="text-center mb-6">
                  <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">Upload Images</h2>
                  <p className="text-muted-foreground">
                    Upload multiple images for editing and compression
                  </p>
                </div>

                <div
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-10 w-10 text-primary/60 mb-4" />
                  <p className="text-sm text-muted-foreground text-center">
                    Drag and drop your images here, click to browse, or paste
                    from clipboard
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />

                <Button
                  onClick={handleUploadClick}
                  className="w-full mt-4"
                  size="lg"
                >
                  Select Images
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Image Gallery - Animated when minimized */}
              <div
                className={`image-gallery-grid ${
                  isEditMode ? "minimized" : ""
                } p-2 bg-gray-800 rounded-lg`}
              >
                {isEditMode && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <Lock className="h-6 w-6 text-white opacity-70" />
                    <span className="ml-2 text-white text-sm opacity-70">
                      Editing Mode Active
                    </span>
                  </div>
                )}

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
                        onClick={() => selectImage(image)}
                        className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                        aria-label="Expand image"
                        disabled={isEditMode}
                      >
                        <Maximize2 size={20} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                      disabled={isEditMode}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Main content area with animated layout */}
              <div className="flex flex-wrap mt-4">
                {/* Sidebar with exit animation */}
                <div
                  className={`sidebar-container ${
                    sidebarExiting ? "exit" : ""
                  }`}
                >
                  {selectedImage && !isEditMode && (
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">
                        Image Properties
                      </h3>
                      <div className="space-y-2">
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {selectedImage.file.name}
                        </p>
                        <p>
                          <span className="font-medium">Size:</span>{" "}
                          {Math.round(selectedImage.file.size / 1024)} KB
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {selectedImage.file.type}
                        </p>
                      </div>

                      <div className="mt-4">
                        <Button onClick={toggleEditMode} className="w-full">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Image Mode
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main canvas with expansion animation */}
                <div
                  className={`canvas-container ${
                    canvasExpanding ? "fullscreen canvas-expand" : ""
                  }`}
                >
                  {selectedImage ? (
                    isEditMode ? (
                      /* Image Editor UI */
                      <div className="space-y-4">
                        {/* Editor toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 mr-2">
                              <Button variant="outline">
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Button variant="outline">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button variant="outline">
                              <Crop className="mr-2 h-4 w-4" />
                              Crop Image
                            </Button>
                            <Button variant="outline">
                              <Droplets className="mr-2 h-4 w-4" />
                              Blur Tool
                            </Button>
                            <Button variant="outline">
                              <Paintbrush className="mr-2 h-4 w-4" />
                              Paint Tool
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={toggleEditMode} variant="default">
                              <X className="mr-2 h-4 w-4" />
                              Exit Edit Mode
                            </Button>
                          </div>
                        </div>

                        {/* Canvas area */}
                        <div
                          className="relative border rounded-lg overflow-hidden"
                          style={{ height: "calc(100vh - 240px)" }}
                        >
                          <img
                            src={selectedImage.url}
                            alt="Edited image"
                            className="max-w-full transform origin-top-left"
                            style={{ maxHeight: "100%" }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Preview UI */
                      <div className="flex items-center justify-center p-12 text-center">
                        <div className="max-w-md">
                          <h3 className="text-xl font-medium mb-2">
                            {selectedImage.file.name}
                          </h3>
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4">
                            <Image
                              src={selectedImage.url}
                              alt={selectedImage.file.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <p className="text-muted-foreground mb-4">
                            Click the Edit Image Mode button to start editing
                            this image.
                          </p>
                          <Button onClick={toggleEditMode}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Image Mode
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    /* No image selected state */
                    <div className="flex items-center justify-center p-12 text-center h-64">
                      <div className="max-w-md">
                        <Info className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-xl font-medium mb-2">
                          Click on an image to select
                        </h3>
                        <p className="text-muted-foreground">
                          Select any image from the gallery above to view, edit,
                          or convert it.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom stats bar with exit animation */}
              <div className={`bottom-bar ${bottomBarExiting ? "exit" : ""}`}>
                {selectedImage && !isEditMode && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg mt-6">
                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">Original Image</h4>
                      <p>
                        Format:{" "}
                        {selectedImage.file.type.split("/")[1].toUpperCase()}
                      </p>
                      <p>
                        Size: {Math.round(selectedImage.file.size / 1024)} KB
                      </p>
                    </div>

                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">Actions</h4>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="mr-2 h-4 w-4" />
                          Replace
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-700 rounded-lg">
                      <h4 className="font-medium mb-2">Settings</h4>
                      <div className="flex gap-2">
                        <Select value="original">
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Original Quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="original">
                              Original Quality
                            </SelectItem>
                            <SelectItem value="high">High Quality</SelectItem>
                            <SelectItem value="medium">
                              Medium Quality
                            </SelectItem>
                            <SelectItem value="low">Low Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
