"use client";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type ClipboardEvent,
} from "react";
import Image from "next/image";
import { X, Upload, ImageIcon, Info, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  getAllImages,
  saveImage,
  deleteImage,
  deleteAllImages,
  fileToBase64,
} from "@/app/utils/indexedDB";

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

interface ImageGalleryProps {
  onSelectImage?: (image: ImageFile) => void;
  standalone?: boolean;
}

export default function ImageGallery({
  onSelectImage,
  standalone = false,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [newImageAdded, setNewImageAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load images from IndexedDB on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const storedImages = await getAllImages();

        if (storedImages && storedImages.length > 0) {
          // Convert stored images back to ImageFile objects
          const loadedImages = storedImages.map((img) => {
            // Create a File object from the stored data
            const fileData = img.fileData;
            const base64Data = fileData.includes("base64,")
              ? fileData
              : `data:${img.type};base64,${fileData}`;

            // Convert base64 to blob
            const byteString = atob(base64Data.split(",")[1]);
            const mimeString = base64Data
              .split(",")[0]
              .split(":")[1]
              .split(";")[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);

            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }

            const blob = new Blob([ab], { type: mimeString });
            const file = new File([blob], img.name, { type: img.type });

            // Create object URL for display
            const objectUrl = URL.createObjectURL(blob);

            return {
              id: img.id,
              file: file,
              url: objectUrl,
            };
          });

          setImages(loadedImages);
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

    if (isMounted) {
      loadImages();
    }

    // Clean up object URLs on unmount
    return () => {
      images.forEach((image) => {
        if (image.url) {
          URL.revokeObjectURL(image.url);
        }
      });
    };
  }, [isMounted]);

  // Save images to IndexedDB whenever they change
  useEffect(() => {
    const saveImages = async () => {
      if (images.length > 0) {
        try {
          // Save each image to IndexedDB
          await Promise.all(
            images.map(async (img) => {
              // Convert File to base64
              const fileData = await fileToBase64(img.file);

              // Save to IndexedDB
              await saveImage({
                id: img.id,
                name: img.file.name,
                type: img.file.type,
                fileData: fileData, // Include the full data URL
                url: img.url,
                width: img.file.size > 0 ? undefined : 0, // Add metadata
                height: img.file.size > 0 ? undefined : 0,
                lastModified: img.file.lastModified,
              });
            })
          );
        } catch (error) {
          console.error("Error saving images:", error);
        }
      }
    };

    // Only save if not in initial loading state and component is mounted
    if (!isLoading && isMounted) {
      saveImages();
    }
  }, [images, isLoading, isMounted]);

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
    }
  };

  // Reset the new image added flag after animation completes
  useEffect(() => {
    if (newImageAdded && isMounted) {
      const timer = setTimeout(() => {
        setNewImageAdded(false);
      }, 800); // Match this to the animation duration
      return () => clearTimeout(timer);
    }
  }, [newImageAdded, isMounted]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = async (id: string) => {
    // Find the image to get its URL for cleanup
    const imageToRemove = images.find((image) => image.id === id);
    if (imageToRemove && imageToRemove.url) {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(imageToRemove.url);
    }

    // Remove from state
    setImages(images.filter((image) => image.id !== id));

    // Remove from IndexedDB
    try {
      await deleteImage(id);
    } catch (error) {
      console.error("Error deleting image from database:", error);
    }

    if (images.length <= 1) {
      setUploadComplete(false);
    }
  };

  const selectImage = (image: ImageFile) => {
    if (onSelectImage) {
      onSelectImage(image);
    } else {
      // If no selection handler provided, navigate to the editor page
      router.push(`/image-editor/${image.id}`);
    }
  };

  const resetUpload = async () => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    // Clear state
    setImages([]);
    setUploadComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Clear IndexedDB
    try {
      await deleteAllImages();
    } catch (error) {
      console.error("Error clearing image database:", error);
    }
  };

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

    // Only add the listener when the component is mounted
    if (isMounted) {
      document.addEventListener(
        "paste",
        handlePaste as unknown as EventListener
      );

      // Clean up
      return () => {
        document.removeEventListener(
          "paste",
          handlePaste as unknown as EventListener
        );
      };
    }
  }, [isMounted]); // Include isMounted in the dependency array

  // Prevent rendering content that might cause hydration mismatch until client-side
  if (!isMounted) {
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

  if (isLoading) {
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
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Image Gallery</h3>
        <div className="flex gap-2">
          <Button onClick={handleUploadClick} variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload More
          </Button>
          <Button onClick={resetUpload} variant="destructive" size="sm">
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        </div>
      </div>

      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${
          newImageAdded ? "animate-pulse-once" : ""
        }`}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group aspect-square animate-fade-scale-in rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => selectImage(image)}
          >
            {image.url ? (
              <Image
                src={image.url}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover"
              />
            ) : (
              <div className="image-placeholder placeholder-shimmer w-full h-full">
                <span className="sr-only">{`Uploaded image ${index + 1}`}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                className="p-2 bg-blue-500 text-white rounded-full transform transition-transform group-hover:scale-110"
                aria-label="Edit image"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  selectImage(image);
                }}
              >
                <Edit2 size={20} />
              </Button>
            </div>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                removeImage(image.id);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove image"
              size="icon"
              variant="destructive"
            >
              <X size={16} />
            </Button>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
              <p className="text-xs text-white truncate">{image.file.name}</p>
            </div>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <div className="flex items-center justify-center p-12 text-center">
          <div className="max-w-md">
            <Info className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">
              No images in your gallery
            </h3>
            <p className="text-muted-foreground mb-4">
              Upload images to start editing, resizing, or converting them.
            </p>
            <Button onClick={handleUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
          </div>
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
