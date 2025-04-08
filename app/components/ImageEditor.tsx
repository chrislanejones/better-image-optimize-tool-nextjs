// components/ImageEditor.tsx
"use client";

import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  getImageById,
  deleteAllImages,
  createFileFromBase64,
} from "@/app/utils/indexedDB";
import ImageCropper from "@/app/image-cropper";

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

export default function ImageEditorPage() {
  const router = useRouter();
  const params = useParams();
  const imageId = params.id as string;
  const [image, setImage] = useState<ImageFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingActive, setIsEditingActive] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setLoading(true);
        const foundImage = await getImageById(imageId);

        if (foundImage) {
          const file = createFileFromBase64(
            foundImage.fileData.includes("base64,")
              ? foundImage.fileData
              : `data:${foundImage.type};base64,${foundImage.fileData}`,
            foundImage.name,
            foundImage.type
          );
          const objectUrl = URL.createObjectURL(file);
          setImage({ id: foundImage.id, file, url: objectUrl });
        } else {
          setError("Image not found");
        }
      } catch (err) {
        console.error("Error loading image:", err);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    return () => {
      if (image?.url) URL.revokeObjectURL(image.url);
    };
  }, [imageId]);

  const handleBackToGallery = () => router.push("/");

  // Handle editing mode changes
  const handleEditModeChange = (isEditing: boolean) => {
    setIsEditingActive(isEditing);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center animate-pulse">
          <div className="h-10 w-10 mx-auto bg-gray-300 rounded-full animate-spin mb-4 border-t-2 border-blue-500"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Image Not Found</h2>
          <p className="mb-6">{error || "The image could not be found."}</p>
          <Button onClick={handleBackToGallery}>Back to Gallery</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50 dark:bg-gray-900">
      <div
        className={`mb-6 transition-opacity duration-300 ${
          isEditingActive ? "opacity-50" : "opacity-100"
        }`}
      >
        <Button
          variant="outline"
          onClick={handleBackToGallery}
          className="mb-4"
          disabled={isEditingActive}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
        </Button>
        <h1 className="text-2xl font-bold">Edit Image</h1>

        {isEditingActive && (
          <div className="mt-2 p-2 bg-gray-800 text-white rounded-md flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-lock h-5 w-5 mr-2"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <span>Editing Mode Active</span>
          </div>
        )}
      </div>

      <ImageCropper
        image={image}
        onUploadNew={handleBackToGallery}
        onRemoveAll={async () => {
          await deleteAllImages();
          handleBackToGallery();
        }}
        onBackToGallery={handleBackToGallery}
        onEditModeChange={handleEditModeChange}
        isStandalone
      />
    </div>
  );
}
