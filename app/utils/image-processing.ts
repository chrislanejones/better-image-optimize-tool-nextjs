import {
  getMimeType,
  rotateImage as rotateImageUtil,
  loadImage,
  canvasToBlob,
  downloadBulkCroppedImages,
  bulkCropImages,
  downloadImagesAsZip,
} from "./image-utils";
import { ImageFormat } from "../../types/types";

// Re-export the rotation function from image-utils
export const rotateImage = rotateImageUtil;

// Re-export bulk processing functions
export { downloadBulkCroppedImages, bulkCropImages, downloadImagesAsZip };

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

/**
 * Enhanced bulk processing with better error handling and progress
 */
export async function processBulkImages(
  imageUrls: string[],
  operation: "crop" | "resize" | "rotate",
  options: {
    crop?: {
      x: number;
      y: number;
      width: number;
      height: number;
      unit: string;
    };
    resize?: { width: number; height: number };
    rotate?: { degrees: number };
    format?: ImageFormat | string;
    quality?: number;
  },
  onProgress?: (
    progress: number,
    current: number,
    total: number,
    stage: string
  ) => void
): Promise<Array<{ blob: Blob; fileName: string }>> {
  const results: Array<{ blob: Blob; fileName: string }> = [];
  const { format = "jpeg", quality = 0.9 } = options;

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];

    // Update progress
    if (onProgress) {
      onProgress(
        Math.round((i / imageUrls.length) * 100),
        i + 1,
        imageUrls.length,
        `Processing ${operation}...`
      );
    }

    try {
      let processedUrl: string;

      switch (operation) {
        case "crop":
          if (!options.crop) throw new Error("Crop options required");
          // Convert percentage crop to actual crop for processing
          processedUrl = await cropImageUrl(
            imageUrl,
            options.crop,
            format,
            quality
          );
          break;

        case "resize":
          if (!options.resize) throw new Error("Resize options required");
          processedUrl = await resizeImageUrl(
            imageUrl,
            options.resize.width,
            options.resize.height,
            format,
            quality
          );
          break;

        case "rotate":
          if (!options.rotate) throw new Error("Rotate options required");
          processedUrl = await rotateImage(
            imageUrl,
            options.rotate.degrees,
            format,
            quality
          );
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      // Convert processed URL to blob
      const response = await fetch(processedUrl);
      const blob = await response.blob();

      results.push({
        blob,
        fileName: `${operation}-image-${i + 1}.${
          format === "jpeg" ? "jpg" : format
        }`,
      });

      // Clean up the temporary URL
      URL.revokeObjectURL(processedUrl);
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
      // Continue with other images even if one fails
    }
  }

  return results;
}

/**
 * Helper function to crop an image from URL
 */
async function cropImageUrl(
  imageUrl: string,
  crop: { x: number; y: number; width: number; height: number; unit: string },
  format: string,
  quality: number
): Promise<string> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate crop dimensions in pixels
  const cropX = (crop.x / 100) * img.naturalWidth;
  const cropY = (crop.y / 100) * img.naturalHeight;
  const cropWidth = (crop.width / 100) * img.naturalWidth;
  const cropHeight = (crop.height / 100) * img.naturalHeight;

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  // Draw the cropped portion
  ctx.drawImage(
    img,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  const blob = await canvasToBlob(canvas, format, quality);
  return URL.createObjectURL(blob);
}

/**
 * Helper function to resize an image from URL
 */
async function resizeImageUrl(
  imageUrl: string,
  width: number,
  height: number,
  format: string,
  quality: number
): Promise<string> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = width;
  canvas.height = height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, format, quality);
  return URL.createObjectURL(blob);
}

/**
 * Aggressive compression for when file size is critical
 */
export async function compressImageAggressively(
  url: string,
  maxWidth = 1200,
  format: ImageFormat | string = "webp",
  targetSizeKB = 500,
  compressionLevel: string = "medium"
): Promise<{
  url: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}> {
  const img = await loadImage(url);
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  let quality =
    compressionLevel === "extremeBW"
      ? 30
      : compressionLevel === "extremeSmall"
      ? 60
      : format === "webp"
      ? 80
      : 85;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  let resultBlob: Blob;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    canvas.width = width;
    canvas.height = height;

    // APPLY FILTER BEFORE DRAW
    if (compressionLevel === "extremeBW") {
      ctx.filter = "grayscale(100%)";
    } else {
      ctx.filter = "none";
    }

    ctx.drawImage(img, 0, 0, width, height);

    // RESET filter so other operations (like toBlob) aren't affected
    ctx.filter = "none";

    resultBlob = await canvasToBlob(canvas, format, quality);
    const currentSizeKB = resultBlob.size / 1024;

    if (
      currentSizeKB <= targetSizeKB ||
      quality <= 30 ||
      attempts >= maxAttempts
    ) {
      break;
    }

    quality = Math.max(30, quality - 15);

    if (attempts >= 2 && currentSizeKB > targetSizeKB * 1.5) {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }

    attempts++;
  } while (true);

  const resultUrl = URL.createObjectURL(resultBlob);
  return {
    url: resultUrl,
    blob: resultBlob,
    size: resultBlob.size,
    width,
    height,
  };
}
