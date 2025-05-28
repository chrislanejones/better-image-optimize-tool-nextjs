// utils/image-processing.ts
import { getMimeType, rotateImage as rotateImageUtil } from "./image-utils";

// Re-export the rotation function from image-utils
export const rotateImage = rotateImageUtil;

// Additional rotation utilities
export async function rotateImageWithCrop(
  imageUrl: string,
  degrees: number,
  format: string = "jpeg",
  quality: number = 85,
  cropToOriginalSize: boolean = false
): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      const radians = (degrees * Math.PI) / 180;

      if (cropToOriginalSize) {
        // Keep original dimensions (crop the rotated image)
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      } else {
        // Calculate bounding box for rotated image
        const sin = Math.abs(Math.sin(radians));
        const cos = Math.abs(Math.cos(radians));
        canvas.width = Math.floor(
          img.naturalWidth * cos + img.naturalHeight * sin
        );
        canvas.height = Math.floor(
          img.naturalWidth * sin + img.naturalHeight * cos
        );
      }

      // Rotate around center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(radians);
      ctx.drawImage(
        img,
        -img.naturalWidth / 2,
        -img.naturalHeight / 2,
        img.naturalWidth,
        img.naturalHeight
      );

      const rotatedImageUrl = canvas.toDataURL(
        getMimeType(format),
        quality / 100
      );
      resolve(rotatedImageUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

// Flip image horizontally or vertically
export async function flipImage(
  imageUrl: string,
  horizontal: boolean = true,
  format: string = "jpeg",
  quality: number = 85
): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      if (horizontal) {
        // Flip horizontally
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      } else {
        // Flip vertically
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
      }

      ctx.drawImage(img, 0, 0);

      const flippedImageUrl = canvas.toDataURL(
        getMimeType(format),
        quality / 100
      );
      resolve(flippedImageUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
}

export async function processImageForStats(
  imageUrl: string,
  format: string,
  quality: number,
  targetWidth?: number,
  targetHeight?: number
): Promise<{
  url: string;
  blob: Blob;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use target dimensions or original
      const width = targetWidth || img.naturalWidth;
      const height = targetHeight || img.naturalHeight;

      canvas.width = width;
      canvas.height = height;

      // Enable high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob"));
            return;
          }

          const url = URL.createObjectURL(blob);
          resolve({
            url,
            blob,
            width,
            height,
            size: blob.size,
          });
        },
        getMimeType(format),
        quality / 100
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}

export function calculateImageStats(
  originalSize: number,
  newSize: number,
  originalDimensions: { width: number; height: number },
  newDimensions: { width: number; height: number }
): {
  sizeReduction: number;
  dimensionChange: {
    widthPercent: number;
    heightPercent: number;
  };
  compressionRatio: number;
} {
  const sizeReduction =
    originalSize > 0 ? 100 - (newSize / originalSize) * 100 : 0;

  const widthPercent =
    originalDimensions.width > 0
      ? (newDimensions.width / originalDimensions.width) * 100
      : 100;

  const heightPercent =
    originalDimensions.height > 0
      ? (newDimensions.height / originalDimensions.height) * 100
      : 100;

  const compressionRatio = originalSize > 0 ? originalSize / newSize : 1;

  return {
    sizeReduction,
    dimensionChange: {
      widthPercent,
      heightPercent,
    },
    compressionRatio,
  };
}

export function estimateFileSize(
  originalSize: number,
  originalDimensions: { width: number; height: number },
  newDimensions: { width: number; height: number },
  format: string,
  quality: number
): number {
  // Calculate pixel ratio
  const originalPixels = originalDimensions.width * originalDimensions.height;
  const newPixels = newDimensions.width * newDimensions.height;
  const pixelRatio = newPixels / originalPixels;

  // Format-specific compression factors
  let formatFactor = 1;
  switch (format) {
    case "webp":
      formatFactor = 0.65; // WebP is typically 65% of JPEG size
      break;
    case "jpeg":
      formatFactor = 1.0;
      break;
    case "png":
      formatFactor = 1.5; // PNG is typically larger
      break;
  }

  // Quality factor (assuming base quality of 85)
  const qualityFactor = quality / 85;

  // Estimate new size
  const estimatedSize =
    originalSize * pixelRatio * formatFactor * qualityFactor;

  return Math.round(estimatedSize);
}

export async function downloadProcessedImage(
  canvas: HTMLCanvasElement,
  fileName: string,
  format: string,
  quality: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        const extension = format === "jpeg" ? "jpg" : format;
        const baseFileName = fileName.split(".")[0] || "image";
        a.download = `${baseFileName}-edited.${extension}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        resolve();
      },
      getMimeType(format),
      quality / 100
    );
  });
}
