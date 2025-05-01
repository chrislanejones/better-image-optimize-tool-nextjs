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
import {
  X,
  Upload,
  ImageIcon,
  Info,
  Edit2,
  Lock,
  Maximize2,
  Crop,
  Droplets,
  Paintbrush,
  Minus,
  Plus,
  Eraser,
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
import { useRouter } from "next/navigation";
import { imageDB } from "@/app/utils/indexedDB";
import {
  ImagePlaceholder,
  LoadingPlaceholder,
  EmptyPlaceholder,
} from "./components/placeholder";
import { Slider } from "@/components/ui/slider";
import ReactCrop, {
  type Crop as CropType,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getFileFormat, getMimeType } from "@/app/utils/image-utils";

interface ImageFile {
  id: string;
  file: File;
  url: string;
  isNew?: boolean;
}

interface ImageGalleryProps {
  onSelectImage?: (image: ImageFile) => void;
  standalone?: boolean;
}

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
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
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const storedImages = await imageDB.getAllImages();
        if (storedImages && storedImages.length > 0) {
          const loadedImages = storedImages.map((img) => {
            return {
              id: img.id,
              file: img.file,
              url: img.url,
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
    if (isMounted) loadImages();
    return () => {
      images.forEach((image) => image.url && URL.revokeObjectURL(image.url));
    };
  }, [isMounted]);

  useEffect(() => {
    const saveImages = async () => {
      if (images.length > 0) {
        try {
          await Promise.all(
            images.map(async (img) => {
              if (img.isNew) {
                await imageDB.saveImage({
                  id: img.id,
                  file: img.file,
                  url: img.url,
                });
              }
            })
          );
        } catch (error) {
          console.error("Error saving images:", error);
        }
      }
    };
    if (!isLoading && isMounted) saveImages();
  }, [images, isLoading, isMounted]);

  useEffect(() => {
    if (selectedImage?.url) {
      setPreviewUrl(selectedImage.url);
    }
    return () => {
      if (previewUrl && selectedImage && previewUrl !== selectedImage.url) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [selectedImage]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);
  };

  const addFiles = (files: FileList) => {
    const newImages: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        newImages.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          isNew: true,
        });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setUploadComplete(true);
      setNewImageAdded(true);

      // Remove the isNew flag after animation completes
      setTimeout(() => {
        setImages((prevImages) =>
          prevImages.map((img) => ({ ...img, isNew: false }))
        );
      }, 1500); // Match with animation duration
    }
  };

  useEffect(() => {
    if (newImageAdded && isMounted) {
      const timer = setTimeout(() => setNewImageAdded(false), 800);
      return () => clearTimeout(timer);
    }
  }, [newImageAdded, isMounted]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const removeImage = async (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url) URL.revokeObjectURL(imageToRemove.url);
    setImages(images.filter((img) => img.id !== id));
    try {
      await imageDB.deleteImage(id);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
    if (images.length <= 1) setUploadComplete(false);
  };

  const selectImage = (image: ImageFile) => {
    if (onSelectImage) {
      onSelectImage(image);
    } else {
      setSelectedImage(image);
      setIsEditMode(true);
    }
  };

  const resetUpload = async () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      await imageDB.deleteAllImages();
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

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      }
    };
    if (isMounted) {
      document.addEventListener(
        "paste",
        handlePaste as unknown as EventListener
      );
      return () =>
        document.removeEventListener(
          "paste",
          handlePaste as unknown as EventListener
        );
    }
  }, [isMounted]);

  // Image Editor Controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleToggleCropping = () => {
    setIsCropping((prev) => !prev);
    setIsBlurring(false);
    setIsPainting(false);
  };

  const handleToggleBlurring = () => {
    setIsBlurring((prev) => !prev);
    setIsCropping(false);
    setIsPainting(false);
  };

  const handleTogglePainting = () => {
    setIsPainting((prev) => !prev);
    setIsCropping(false);
    setIsBlurring(false);
  };

  const handleExitEditMode = () => {
    setIsEditMode(false);
    setSelectedImage(null);
    setZoomLevel(1);
    setIsCropping(false);
    setIsBlurring(false);
    setIsPainting(false);
  };

  const handleEditImage = (image: ImageFile) => {
    // Navigate to the image editor page with the image ID
    router.push(`/image-editor/${image.id}`);
  };

  if (!isMounted || isLoading) {
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
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
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
            onClick={resetUpload}
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
          {/* Thumbnail strip with editing mode indicator */}
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
                    <Button onClick={handleZoomOut} variant="outline">
                      <span className="text-lg">-</span>
                    </Button>
                    <Button onClick={handleZoomIn} variant="outline">
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                  <Button onClick={handleToggleCropping} variant="outline">
                    <Crop className="mr-2 h-4 w-4" />
                    Crop Image
                  </Button>
                  <Button onClick={handleToggleBlurring} variant="outline">
                    <Droplets className="mr-2 h-4 w-4" />
                    Blur Tool
                  </Button>
                  <Button onClick={handleTogglePainting} variant="outline">
                    <Paintbrush className="mr-2 h-4 w-4" />
                    Paint Tool
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleExitEditMode} variant="default">
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
                            style={{ transform: `scale(${zoomLevel})` }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden"></canvas>
            </div>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          ref={fileInputRef}
          onChange={handleFileChange}
        />
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
                removeImage(image.id);
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
