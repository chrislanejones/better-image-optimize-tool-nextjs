"use client";

import type { PixelCrop } from "react-image-crop";

/**
 * Image format type definition
 */
export type ImageFormat = "jpeg" | "png" | "webp";

/**
 * Convert a format string to its MIME type
 */
export function getMimeType(format: string): string {
  if (format === "webp") return "image/webp";
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  return "image/jpeg"; // Default fallback
}

/**
 * Extract format from file type
 */
export function getFileFormat(fileType: string | undefined): string {
  if (!fileType || typeof fileType !== "string") return "unknown";
  const parts = fileType.split("/");
  return parts.length > 1 ? parts[1] : "unknown";
}

/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64Data: string, mimeType: string): Blob {
  // Remove data URL prefix if present
  const base64WithoutPrefix = base64Data.replace(
    /^data:image\/(png|jpeg|jpg|webp);base64,/,
    ""
  );

  try {
    // Convert base64 to byte array
    const byteCharacters = atob(base64WithoutPrefix);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  } catch (error) {
    console.error("Error converting base64 to blob:", error);
    return new Blob([], { type: mimeType });
  }
}

/**
 * Create a File from a Blob
 */
export function createFileFromBlob(
  blob: Blob,
  fileName: string,
  format: ImageFormat = "jpeg"
): File {
  return new File([blob], fileName, {
    type: getMimeType(format),
    lastModified: Date.now(),
  });
}

/**
 * Safely revoke an object URL to prevent memory leaks
 */
export function safeRevokeURL(url: string | null | undefined): void {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Failed to revoke object URL:", e);
    }
  }
}

/**
 * Format bytes to a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
}

/**
 * Calculate size reduction percentage
 */
export function calculateSizeReduction(
  originalSize: number,
  newSize: number
): number {
  if (originalSize <= 0) return 0;
  return 100 - (newSize / originalSize) * 100;
}

/**
 * Get image dimensions from a URL
 */
export function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Calculate aspect ratio
 */
export function calculateAspectRatio(width: number, height: number): number {
  return height > 0 ? width / height : 1;
}

/**
 * Generate a unique filename
 */
export function generateUniqueFileName(
  originalName: string,
  format: ImageFormat = "jpeg"
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}.${format}`;
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number,
  maxWidth = 8000,
  maxHeight = 8000
): boolean {
  return width > 0 && height > 0 && width <= maxWidth && height <= maxHeight;
}

/**
 * Convert File to data URL
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Apply crop to an image and return the result as a URL
 */
export async function cropImage(
  image: HTMLImageElement,
  crop: PixelCrop,
  format: ImageFormat = "jpeg",
  quality = 0.9
): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Calculate scale if the displayed image is resized
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Set canvas dimensions to crop dimensions
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Draw the cropped portion of the image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    // Convert to blob and create URL
    const blob = await canvasToBlob(canvas, format, quality);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error cropping image:", error);
    throw error;
  }
}

/**
 * Resize an image and return the result as a URL
 */
export async function resizeImage(
  image: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat = "jpeg",
  quality = 0.9
): Promise<string> {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas dimensions to desired resize values
    canvas.width = width;
    canvas.height = height;

    // Draw the image with new dimensions
    ctx.drawImage(image, 0, 0, width, height);

    // Convert to blob and create URL
    const blob = await canvasToBlob(canvas, format, quality);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error resizing image:", error);
    throw error;
  }
}

/**
 * Convert a canvas to a blob
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = "jpeg",
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }
        resolve(blob);
      },
      getMimeType(format),
      quality
    );
  });
}

/**
 * Optimize canvas settings for better performance
 */
export function optimizeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): void {
  // Disable image smoothing for pixel-perfect rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Enable alpha channel
  ctx.globalAlpha = 1;

  // Reset transform matrix
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Check if WebP format is supported by the browser
 */
export async function isWebPSupported(): Promise<boolean> {
  const canvas = document.createElement("canvas");
  if (!canvas.toDataURL) return false;
  return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
}
