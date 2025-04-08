"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  getImageById,
  deleteAllImages,
  createFileFromBase64,
} from "@/app/utils/indexedDB";

// Dynamically import the ImageCropper component to prevent hydration mismatch
// This ensures it only renders on the client side
const ImageCropper = dynamic(() => import("@/app/image-cropper"), {
  ssr: false, // Disable server-side rendering
  loading: () => (
    <div className="animate-pulse flex items-center justify-center h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full animate-spin mb-4 border-t-2 border-blue-500"></div>
        <p>Loading editor...</p>
      </div>
    </div>
  ),
});

interface ImageFile {
  id: string;
  file: File;
  url: string;
}

export default function ImageEditor() {
  const router = useRouter();
  const params = useParams();
  const imageId = params.id as string;
  const [image, setImage] = useState<ImageFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve the image from IndexedDB
    const loadImage = async () => {
      try {
        setLoading(true);
        const foundImage = await getImageById(imageId);

        if (foundImage) {
          // Create a File object from the stored data
          const file = createFileFromBase64(
            foundImage.fileData.includes("base64,")
              ? foundImage.fileData
              : `data:${foundImage.type};base64,${foundImage.fileData}`,
            foundImage.name,
            foundImage.type
          );

          // Create object URL for the image
          const objectUrl = URL.createObjectURL(file);

          setImage({
            id: foundImage.id,
            file: file,
            url: objectUrl,
          });
        } else {
          setError("Image not found");
        }
      } catch (error) {
        console.error("Error loading image:", error);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    loadImage();

    // Clean up object URL when component unmounts
    return () => {
      if (image && image.url) {
        URL.revokeObjectURL(image.url);
      }
    };
  }, [imageId]);

  const handleUploadNew = () => {
    router.push("/");
  };

  const handleRemoveAll = async () => {
    try {
      await deleteAllImages();
    } catch (error) {
      console.error("Error removing images:", error);
    }
    router.push("/");
  };

  const handleBackToGallery = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-gray-300 rounded mb-4 mx-auto"></div>
          <div className="h-64 w-full max-w-md bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Image Not Found</h2>
          <p className="mb-6">
            {error ||
              "The image you're looking for doesn't exist or was removed."}
          </p>
          <Button onClick={handleBackToGallery}>Back to Gallery</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBackToGallery}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Gallery
        </Button>
        <h1 className="text-2xl font-bold">Edit Image</h1>
      </div>

      {/* Only render ImageCropper when image is available */}
      {image && (
        <ImageCropper
          image={image}
          onUploadNew={handleUploadNew}
          onRemoveAll={handleRemoveAll}
          onBackToGallery={handleBackToGallery}
          isStandalone={true}
        />
      )}
    </div>
  );
}
