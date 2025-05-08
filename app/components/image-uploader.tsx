"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { type ImageFile, type ImageUploaderProps } from "@/types/editor";

export default function ImageUploader({
  onImagesUploaded,
  maxImages = 50,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);
  };

  // Add files to state
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

    if (newImages.length > 0) {
      onImagesUploaded(newImages);
    }
  };

  // Open file dialog
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        addFiles(e.clipboardData.files);
      }
    };

    if (isMounted) {
      document.addEventListener("paste", handlePaste);
      return () => document.removeEventListener("paste", handlePaste);
    }
  }, [isMounted]);

  // Don't render until client-side
  if (!isMounted) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-24 bg-gray-300 rounded mb-4"></div>
        <div className="h-64 w-full bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-2">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Upload Images</CardTitle>
        <CardDescription>
          Upload multiple images for editing and compression
          <br />
          <span className="text-sm text-muted-foreground">
            Maximum {maxImages} images allowed
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
