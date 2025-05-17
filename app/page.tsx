"use client";

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
import {
  X,
  Maximize2,
  Upload,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
import { ImageFile, NavigationDirection } from "@/types/types";
import ImageEditor from "@/app/image-editor";
import SimplePagination from "./components/pagination-controls";

// Constants for pagination
const IMAGES_PER_PAGE = 10;

export default function ImageUploader() {
  // Main state
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [newImageAdded, setNewImageAdded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);

  // Get current page images
  const getCurrentPageImages = useCallback(() => {
    const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
    const endIndex = startIndex + IMAGES_PER_PAGE;
    return images.slice(startIndex, endIndex);
  }, [images, currentPage]);

  // Current images to display
  const currentImages = getCurrentPageImages();

  // Reset the new image added flag after animation completes
  useEffect(() => {
    if (newImageAdded) {
      const timer = setTimeout(() => {
        setNewImageAdded(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [newImageAdded]);

  // File handling
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);
  };

  const addFiles = (files: FileList) => {
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

      // Auto-select first image if none is selected
      if (!selectedImage && newImages.length > 0) {
        setSelectedImage(newImages[0]);
        setCurrentPage(1);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (id: string) => {
    // Check if images array is empty first
    if (images.length === 0) return;

    // Find image index before removing
    const imageIndex = images.findIndex((img) => img.id === id);
    if (imageIndex === -1) return; // Image not found

    // Filter out the image
    const updatedImages = images.filter((image) => image.id !== id);
    setImages(updatedImages);

    // Handle selected image changes
    if (selectedImage?.id === id) {
      if (updatedImages.length > 0) {
        // Try to select the next image, or previous if it was the last one
        const nextIndex = Math.min(imageIndex, updatedImages.length - 1);
        setSelectedImage(updatedImages[nextIndex]);

        // Update page if needed
        const newPage = Math.floor(nextIndex / IMAGES_PER_PAGE) + 1;
        setCurrentPage(newPage);
      } else {
        setSelectedImage(null);
      }
    }

    if (updatedImages.length === 0) {
      setUploadComplete(false);
    }
  };

  const selectImage = (image: ImageFile) => {
    setSelectedImage(image);

    // Update page to show the selected image
    const imageIndex = images.findIndex((img) => img.id === image.id);
    if (imageIndex !== -1) {
      const newPage = Math.floor(imageIndex / IMAGES_PER_PAGE) + 1;
      setCurrentPage(newPage);
    }
  };

  const resetUpload = () => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    setImages([]);
    setUploadComplete(false);
    setSelectedImage(null);
    setCurrentPage(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle image change from editor
  const handleImageChange = (newImageUrl: string) => {
    if (!selectedImage) return;

    // In a full implementation, we would save this to indexedDB or similar
    // For now, just update the URL
    setImages(
      images.map((img) =>
        img.id === selectedImage.id ? { ...img, url: newImageUrl } : img
      )
    );

    // Update selected image with new URL
    setSelectedImage({ ...selectedImage, url: newImageUrl });
  };

  const handleNavigateImage = useCallback(
    (direction: NavigationDirection) => {
      if (images.length === 0 || !selectedImage) return;

      const currentIndex = images.findIndex(
        (img) => img.id === selectedImage.id
      );
      if (currentIndex === -1) return;

      let newIndex;

      switch (direction) {
        case "next":
          // Move to next image, with wrapping
          newIndex = (currentIndex + 1) % images.length;
          break;
        case "prev":
          // Move to previous image, with wrapping
          newIndex = (currentIndex - 1 + images.length) % images.length;
          break;
        case "next10":
          // Jump forward 10 images, but don't exceed the array bounds
          newIndex = Math.min(currentIndex + 10, images.length - 1);
          break;
        case "prev10":
          // Jump backward 10 images, but don't go below 0
          newIndex = Math.max(currentIndex - 10, 0);
          break;
        default:
          return; // Unknown direction
      }

      // Update selected image
      setSelectedImage(images[newIndex]);

      // Update page if necessary
      const newPage = Math.floor(newIndex / IMAGES_PER_PAGE) + 1;
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    },
    [images, selectedImage, currentPage]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Paste event handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      } else if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const imageItems: File[] = [];

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

    document.addEventListener("paste", handlePaste as unknown as EventListener);
    return () => {
      document.removeEventListener(
        "paste",
        handlePaste as unknown as EventListener
      );
    };
  }, []);

  // Upload View (first state)
  if (!uploadComplete) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/50 p-4 rounded-full w-50 h-50 flex items-center justify-center mb-2">
              <Image
                src="/Image-Horse-Logo.svg"
                alt="Horse Icon"
                width={200}
                height={200}
                className="p-1 m-5"
              />
            </div>
            <CardTitle className="text-2xl">ImageHorse</CardTitle>
            <CardDescription>
              Upload Multiple Images for Editing and Compression
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
            <div className="flex flex-col items-center justify-center w-full">
              <Button onClick={handleUploadClick} className="w-full" size="lg">
                Select Images
              </Button>

              {images.length > 0 && (
                <Button
                  onClick={() => setUploadComplete(true)}
                  className="w-full mt-2"
                  variant="default"
                >
                  Return to Images ({images.length})
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Image Editor View (when an image is selected)
  if (selectedImage) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Thumbnail strip */}
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-2 bg-gray-800 rounded-lg mb-6">
          {currentImages.map((image, index) => (
            <div
              key={image.id}
              className={`relative group aspect-square animate-fade-scale-in ${
                selectedImage?.id === image.id ? "ring-2 ring-blue-500" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => selectImage(image)}
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
                >
                  <Maximize2 size={20} />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(image.id);
                }}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Image Editor */}
        <ImageEditor
          imageUrl={selectedImage.url}
          onImageChange={handleImageChange}
          onReset={() => {
            // In a real app, we might reload the original image from a database
            // For now, let's do nothing as we don't have the original stored
          }}
          onDownload={() => {
            const a = document.createElement("a");
            a.href = selectedImage.url;
            a.download = selectedImage.file.name || "image.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }}
          onClose={() => setUploadComplete(false)}
          fileName={selectedImage.file.name}
          fileType={selectedImage.file.type}
          fileSize={selectedImage.file.size}
          currentPage={currentPage}
          totalPages={totalPages}
          onNavigateImage={handleNavigateImage}
          onRemoveAll={resetUpload}
          onUploadNew={handleUploadClick}
        />

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

  // Gallery View (when images are uploaded but none is selected)
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Image Gallery</h1>
        <div className="flex gap-2">
          <Button onClick={handleUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload More
          </Button>
          <Button variant="destructive" onClick={resetUpload}>
            <X className="mr-2 h-4 w-4" />
            Remove All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {currentImages.map((image) => (
          <Card
            key={image.id}
            className="group relative overflow-hidden cursor-pointer"
            onClick={() => selectImage(image)}
          >
            <div className="relative aspect-square w-full">
              <Image
                src={image.url}
                alt={image.file.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 truncate px-2">
              {image.file.name}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(image.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <SimplePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onBackTen={() => handlePageChange(Math.max(1, currentPage - 10))}
            onPrevious={() => handlePageChange(Math.max(1, currentPage - 1))}
            onNext={() =>
              handlePageChange(Math.min(totalPages, currentPage + 1))
            }
            onForwardTen={() =>
              handlePageChange(Math.min(totalPages, currentPage + 10))
            }
            className="ml-4"
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
  );
}
