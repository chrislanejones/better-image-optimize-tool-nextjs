"use client";

import { CardFooter } from "@/components/ui/card";
import {
  useState,
  useRef,
  type ChangeEvent,
  type DragEvent,
  useEffect,
  type ClipboardEvent,
  useCallback,
} from "react";
import Image from "next/image";
import { X, Maximize2, Upload, ImageIcon, Info, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ImageCropper from "./image-cropper";

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

export default function ImageUploader() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newImageAdded, setNewImageAdded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGalleryMinimized, setIsGalleryMinimized] = useState(false);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    addFiles(files);
  }, []);

  const addFiles = useCallback((files: FileList) => {
    const newImages: ImageFile[] = [];

    // Process all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newImages.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
        });
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setUploadComplete(true);
      setNewImageAdded(true);
    }
  }, []);

  // Reset the new image added flag after animation completes
  useEffect(() => {
    if (newImageAdded) {
      const timer = setTimeout(() => {
        setNewImageAdded(false);
      }, 800); // Match this to the animation duration
      return () => clearTimeout(timer);
    }
  }, [newImageAdded]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeImage = useCallback(
    (id: string) => {
      setImages((prev) => prev.filter((image) => image.id !== id));
      setSelectedImage((prev) => (prev?.id === id ? null : prev));
      setUploadComplete((prev) => (images.length <= 1 ? false : prev));
    },
    [images.length]
  );

  const expandImage = useCallback((image: ImageFile) => {
    setSelectedImage(image);
  }, []);

  const resetUpload = useCallback(() => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    setImages([]);
    setUploadComplete(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [images]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
    },
    [isDragging]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // Add useEffect to listen for paste events globally
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      } else if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const imageItems = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              imageItems.push(blob);
            }
          }
        }

        if (imageItems.length > 0) {
          e.preventDefault();
          const fileList = new DataTransfer();
          imageItems.forEach((file) => fileList.items.add(file));
          addFiles(fileList.files);
        }
      }
    };

    // Add the event listener to the document
    document.addEventListener("paste", handlePaste as unknown as EventListener);

    // Clean up
    return () => {
      document.removeEventListener(
        "paste",
        handlePaste as unknown as EventListener
      );
    };
  }, [addFiles]); // Add addFiles to dependency array

  const toggleGalleryMinimized = useCallback((minimized: boolean) => {
    setIsGalleryMinimized(minimized);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      {!uploadComplete ? (
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
                <ImageIcon className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Upload Images</CardTitle>
              <CardDescription>
                Upload multiple images for editing and compression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "border-primary/20 bg-primary/5"
                } rounded-lg hover:bg-primary/10 transition-colors cursor-pointer`}
                onClick={handleUploadClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 text-primary/60 mb-4" />
                <p className="text-sm text-muted-foreground text-center">
                  Drag and drop your images here, click to browse, or paste from
                  clipboard
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
            </CardContent>
            <CardFooter>
              <Button onClick={handleUploadClick} className="w-full" size="lg">
                Select Images
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={`grid grid-cols-5 md:grid-cols-10 gap-2 p-2 bg-gray-800 rounded-lg ${
              newImageAdded ? "animate-pulse-once" : ""
            } ${
              isGalleryMinimized
                ? "opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top"
                : "transition-all duration-300"
            }`}
          >
            {isGalleryMinimized && (
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
                  src={image.url || "/placeholder.svg"}
                  alt="Uploaded image"
                  fill
                  className="object-cover rounded-md"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => expandImage(image)}
                    className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                    aria-label="Expand image"
                    disabled={isGalleryMinimized}
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                  disabled={isGalleryMinimized}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {!selectedImage && (
            <div className="flex items-center justify-center p-12 text-center">
              <div className="max-w-md">
                <Info className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">
                  Click on an image to compress and edit
                </h3>
                <p className="text-muted-foreground">
                  Select any image from the gallery above to start editing,
                  resizing, or converting it.
                </p>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="mt-8">
              <ImageCropper
                image={selectedImage}
                onUploadNew={handleUploadClick}
                onRemoveAll={resetUpload}
                onBackToGallery={() => setSelectedImage(null)}
              />
            </div>
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
      )}
    </div>
  );
}
