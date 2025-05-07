// app/page.tsx
"use client";

import { CardFooter } from "@/components/ui/card";
import { useRef, useEffect, useMemo } from "react";
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
import { useImageStore } from "@/store/useImageStore";
import { useImageActions } from "@/store/useImageActions";
import { useImageCleanup } from "@/store/useImageCleanup";
import { useFileOperations } from "@/store/hooks/useFileOperations";
import { ImageFile } from "@/store/useImageStore";

// --- ZUSTAND DEBUG UTILITIES ---

// Add this hook to your component to debug state updates
export function useZustandDebugger(store, label = "Store") {
  const prevStateRef = useRef(store.getState());

  useEffect(() => {
    // Subscribe to state changes
    const unsubscribe = store.subscribe((state) => {
      const prevState = prevStateRef.current;
      const changedKeys = Object.keys(state).filter(
        (key) => state[key] !== prevState[key]
      );

      if (changedKeys.length > 0) {
        console.group(`[${label}] State changed`);
        changedKeys.forEach((key) => {
          const oldValue = prevState[key];
          const newValue = state[key];
          console.log(`%c${key}`, "font-weight: bold; color: #735cdd", {
            from: oldValue,
            to: newValue,
            changed:
              typeof oldValue === "object" || typeof newValue === "object"
                ? "Cannot compare objects deeply"
                : oldValue !== newValue,
          });
        });
        console.groupEnd();
      }

      prevStateRef.current = state;
    });

    // Initial state debug log
    console.log(`[${label}] Initial state:`, store.getState());

    return unsubscribe;
  }, [store, label]);
}

// Add this to debug component renders
export function useRenderCounter(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(
      `[Render Counter] ${componentName} rendered ${renderCount.current} times`
    );
  });
}

// Add this wrapper to debug props changes
export function withPropDebugging(Component) {
  const DebugComponent = (props) => {
    const prevPropsRef = useRef(null);

    useEffect(() => {
      if (prevPropsRef.current) {
        const prevProps = prevPropsRef.current;
        const changedProps = Object.keys(props).filter(
          (key) => props[key] !== prevProps[key]
        );

        if (changedProps.length > 0) {
          console.group(
            `[${Component.displayName || "Component"}] Props changed`
          );
          changedProps.forEach((key) => {
            console.log(`${key}:`, {
              from: prevProps[key],
              to: props[key],
            });
          });
          console.groupEnd();
        }
      }

      prevPropsRef.current = props;
    });

    return <Component {...props} />;
  };

  DebugComponent.displayName = `DebugProps(${
    Component.displayName || "Component"
  })`;
  return DebugComponent;
}

// Add this to your page component to use these utilities
export default function ImageUploader() {
  // Add the debugger to track state changes
  useZustandDebugger(useImageStore, "ImageStore");

  // Track renders of this component
  useRenderCounter("ImageUploader");

  const MAX_IMAGES = 50;
  const IMAGES_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand state
  const {
    images,
    uploadComplete,
    selectedImage,
    isDragging,
    newImageAdded,
    isEditMode,
  } = useImageStore();

  // Zustand actions
  const actions = useImageActions();

  // Custom hooks
  const fileOperations = useFileOperations();
  useImageCleanup(); // Automatically clean up URLs

  // Pagination
  const currentPage = useImageStore((state) => state.currentPage || 1);
  const setCurrentPage = (page: number) => actions.setCurrentPage(page);

  // Calculate total pages
  const totalPages = useMemo(
    () => Math.ceil(images.length / IMAGES_PER_PAGE),
    [images.length]
  );

  // Get current page images
  const currentImages = useMemo(() => {
    const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
    const endIndex = startIndex + IMAGES_PER_PAGE;
    return images.slice(startIndex, endIndex);
  }, [images, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset the new image added flag after animation completes
  useEffect(() => {
    if (newImageAdded) {
      const timer = setTimeout(() => {
        actions.setNewImageAdded(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [newImageAdded, actions]);

  const handleUploadClick = () => {
    if (images.length >= MAX_IMAGES) {
      alert(
        `Maximum limit of ${MAX_IMAGES} images reached. Please remove some images before uploading more.`
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const expandImage = (image: ImageFile) => {
    actions.selectImage(image);
  };

  const resetUpload = () => {
    // Revoke all object URLs to prevent memory leaks
    images.forEach((image) => {
      URL.revokeObjectURL(image.url);
    });

    actions.resetAll();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add useEffect to listen for paste events globally
  useEffect(() => {
    document.addEventListener(
      "paste",
      fileOperations.handlePaste as EventListener
    );
    return () => {
      document.removeEventListener(
        "paste",
        fileOperations.handlePaste as EventListener
      );
    };
  }, [images.length, fileOperations.handlePaste]);

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
                <br />
                <span className="text-sm text-muted-foreground">
                  Maximum {MAX_IMAGES} images allowed, {IMAGES_PER_PAGE} per
                  page
                </span>
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
                onDragEnter={fileOperations.handleDragEnter}
                onDragOver={fileOperations.handleDragOver}
                onDragLeave={fileOperations.handleDragLeave}
                onDrop={fileOperations.handleDrop}
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
                onChange={fileOperations.handleFileChange}
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
            className={`grid grid-cols-5 md:grid-cols-10 gap-2 p-4 bg-gray-800 rounded-lg ${
              newImageAdded ? "animate-pulse-once" : ""
            } ${
              isEditMode
                ? "opacity-50 max-h-12 overflow-hidden transition-all duration-300 scale-90 transform origin-top"
                : "transition-all duration-300"
            }`}
          >
            {isEditMode ? (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Lock className="h-6 w-6 text-white opacity-70" />
                <span className="ml-2 text-white text-sm opacity-90">
                  Editing Mode Active
                </span>
              </div>
            ) : (
              currentImages.map((image, index) => (
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
                    >
                      <Maximize2 size={20} />
                    </button>
                  </div>
                  <button
                    onClick={() => actions.removeImage(image.id)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
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
                {images.length > IMAGES_PER_PAGE && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing page {currentPage} of {totalPages} ({images.length}{" "}
                    images total)
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="mt-8">
              <ImageCropper
                image={selectedImage}
                onUploadNew={handleUploadClick}
                onRemoveAll={resetUpload}
                onEditModeChange={(editMode) => actions.setIsEditMode(editMode)}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={fileOperations.handleFileChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
