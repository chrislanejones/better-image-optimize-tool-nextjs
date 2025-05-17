// Updated image-utils.ts with fixes for quality normalization
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
 * Create a safe image URL, falling back to placeholder if needed
 */
export function getSafeImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "/placeholder.svg";
  return url;
}

/**
 * Normalize quality value to ensure it's in 0-1 range
 * This helps prevent issues with the canvas.toBlob quality parameter
 */
export function normalizeQuality(quality: number): number {
  // If quality is in 0-100 range, convert to 0-1
  if (quality > 1) {
    return quality / 100;
  }
  // Ensure quality is between 0 and 1
  return Math.max(0, Math.min(1, quality));
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

    // Normalize quality
    const normalizedQuality = normalizeQuality(quality);

    // Convert to blob and create URL
    const blob = await canvasToBlob(canvas, format, normalizedQuality);

    // Log blob size for debugging
    console.log(`Cropped image blob size: ${(blob.size / 1024).toFixed(2)} KB`);

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

    // Enable high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Draw the image with new dimensions
    ctx.drawImage(image, 0, 0, width, height);

    // Normalize quality
    const normalizedQuality = normalizeQuality(quality);

    // Log resize operation for debugging
    console.log(
      `Resizing to ${width}x${height} with format ${format} and quality ${normalizedQuality}`
    );

    // Convert to blob and create URL
    const blob = await canvasToBlob(canvas, format, normalizedQuality);

    // Log blob size for debugging
    console.log(`Resized image blob size: ${(blob.size / 1024).toFixed(2)} KB`);

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error resizing image:", error);
    throw error;
  }
}

/**
 * Convert a canvas to a blob with proper quality handling
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat = "jpeg",
  quality = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Normalize quality to ensure it's between 0-1
    const normalizedQuality = normalizeQuality(quality);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }

        // If blob is too large (over 2MB) and not PNG, try stronger compression
        if (blob.size > 2 * 1024 * 1024 && format !== "png") {
          // Try again with lower quality
          const lowerQuality = Math.max(0.5, normalizedQuality * 0.7);
          console.log(
            `Blob too large (${(blob.size / 1024 / 1024).toFixed(
              2
            )}MB), retrying with quality ${lowerQuality}`
          );

          canvas.toBlob(
            (compressedBlob) => {
              if (!compressedBlob) {
                reject(new Error("Secondary compression failed"));
                return;
              }
              console.log(
                `Compressed to ${(compressedBlob.size / 1024 / 1024).toFixed(
                  2
                )}MB`
              );
              resolve(compressedBlob);
            },
            getMimeType(format),
            lowerQuality
          );
        } else {
          resolve(blob);
        }
      },
      getMimeType(format),
      normalizedQuality
    );
  });
}

/**
 * Get image details from a URL (dimensions, etc.)
 */
export async function getImageDetails(url: string): Promise<{
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image: ${url}`));
    };
    img.src = url;
  });
}

/**
 * Create a file from a blob with the given name and type
 */
export function createFileFromBlob(
  blob: Blob,
  fileName: string,
  format: ImageFormat = "jpeg"
): File {
  const extension = format === "jpeg" ? "jpg" : format;
  const name = fileName.includes(".")
    ? fileName.substring(0, fileName.lastIndexOf(".")) + "." + extension
    : fileName + "." + extension;

  return new File([blob], name, { type: getMimeType(format) });
}

/**
 * Generate a download for an image
 */
export function downloadImage(
  imageUrl: string,
  fileName: string,
  format: ImageFormat = "jpeg"
): void {
  const extension = format === "jpeg" ? "jpg" : format;
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = `${fileName.split(".")[0] || "image"}-edited.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Convert base64 data to a blob
 */
export function base64ToBlob(
  base64Data: string,
  contentType: string = "image/jpeg"
): Blob {
  // Extract the base64 data if it includes the data URL prefix
  const base64 = base64Data.includes("base64,")
    ? base64Data.split("base64,")[1]
    : base64Data;

  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

/**
 * Get a blob from a URL (dataURL or objectURL)
 */
export async function getBlobFromUrl(url: string): Promise<Blob> {
  // Handle data URLs directly
  if (url.startsWith("data:")) {
    const response = await fetch(url);
    return await response.blob();
  }

  // Handle object URLs or regular URLs
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        console.log(
          `Fetched blob with size: ${(blob.size / 1024).toFixed(2)} KB`
        );
        resolve(blob);
      })
      .catch((error) => reject(error));
  });
}

/**
 * Aggressive image compression function
 * Useful for thumbnails or when size is critical
 */
export async function compressImageAggressively(
  url: string,
  maxWidth: number = 1200,
  format: ImageFormat = "webp"
): Promise<{ url: string; blob: Blob; size: number }> {
  // Load the image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = url;
  });

  // Calculate new dimensions while maintaining aspect ratio
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  // Create a canvas with the new dimensions
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  // Draw the image to the canvas with the new dimensions
  ctx.drawImage(img, 0, 0, width, height);

  // Use aggressive compression
  const quality = format === "webp" ? 0.6 : 0.7;

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (resultBlob) => {
        if (!resultBlob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        resolve(resultBlob);
      },
      getMimeType(format),
      quality
    );
  });

  console.log(`Aggressively compressed to ${(blob.size / 1024).toFixed(2)} KB`);

  // Create and return URL
  const resultUrl = URL.createObjectURL(blob);
  return { url: resultUrl, blob, size: blob.size };
}
