"use client";

import { PixelCrop } from "react-image-crop";
import { getMimeType, getFileFormat } from "./image-utils";

/**
 * Apply crop to an image and return the result as a URL
 */
export const cropImage = (
  image: HTMLImageElement,
  crop: PixelCrop,
  format: string = "jpeg"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

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

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve(url);
      },
      getMimeType(format),
      0.9
    );
  });
};

/**
 * Resize an image and return the result as a URL
 */
export const resizeImage = (
  image: HTMLImageElement,
  width: number,
  height: number,
  format: string = "jpeg"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    // Set canvas dimensions to desired resize values
    canvas.width = width;
    canvas.height = height;

    // Draw the image with new dimensions
    ctx.drawImage(image, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve(url);
      },
      getMimeType(format),
      0.9
    );
  });
};

/**
 * Convert an image URL to a Blob
 */
export const urlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return await response.blob();
};

/**
 * Get image details such as dimensions from a URL
 */
export const getImageDetails = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

/**
 * Calculate image size reduction percentage
 */
export const calculateSizeReduction = (
  originalSize: number,
  newSize: number
): number => {
  if (originalSize <= 0) return 0;
  return 100 - (newSize / originalSize) * 100;
};

/**
 * Generate a download URL for an image
 */
export const generateDownloadURL = (
  canvas: HTMLCanvasElement,
  format: string = "jpeg",
  fileName: string = "image"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas to Blob conversion failed"));
          return;
        }

        const url = URL.createObjectURL(blob);
        resolve(url);
      },
      getMimeType(format),
      0.9
    );
  });
};

/**
 * Create a download link for an image
 */
export const createDownloadLink = (
  url: string,
  fileName: string,
  format: string = "jpeg"
): void => {
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.split(".")[0] || "image"}-edited.${
    format === "webp" ? "webp" : format === "jpeg" ? "jpg" : "png"
  }`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Safely revoke an object URL to prevent memory leaks
 */
export const safeRevokeURL = (url: string | null | undefined): void => {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Failed to revoke object URL:", e);
    }
  }
};
