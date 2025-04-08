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
  updateImage,
} from "@/app/utils/indexedDB";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      try {
        setIsLoading(true);
        const storedImages = await getAllImages();
        if (storedImages && storedImages.length > 0) {
          const loadedImages = storedImages.map((img) => {
            const fileData = img.fileData;
            const base64Data = fileData.includes("base64,")
              ? fileData
              : `data:${img.type};base64,${fileData}`;
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
            const objectUrl = URL.createObjectURL(blob);
            return { id: img.id, file, url: objectUrl };
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
              const fileData = await fileToBase64(img.file);
              await saveImage({
                id: img.id,
                name: img.file.name,
                type: img.file.type,
                fileData,
                url: img.url,
                width: img.file.size > 0 ? undefined : 0,
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
        });
      }
    }
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setUploadComplete(true);
      setNewImageAdded(true);
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
      await deleteImage(id);
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
    }
  };

  const resetUpload = async () => {
    images.forEach((img) => URL.revokeObjectURL(img.url));
    setImages([]);
    setUploadComplete(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  // Image Cropper Component Logic
  const handleBackToGallery = () => {
    setSelectedImage(null);
  };

  const handleUploadNew = () => {
    handleUploadClick();
  };

  if (selectedImage) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <Button onClick={() => setSelectedImage(null)}>
            ← Back to Gallery
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden shadow-md">
          <p className="text-center p-4">Image editor will go here...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((image) => (
        <Card
          key={image.id}
          className={`group relative overflow-hidden shadow-md transition-transform transform hover:scale-105 cursor-pointer`}
          onClick={() => selectImage(image)}
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
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              removeImage(image.id);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </Card>
      ))}
    </div>
  );
}
