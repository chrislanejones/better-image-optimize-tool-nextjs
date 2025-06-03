// app/utils/image-processing.ts
import {
  getMimeType,
  rotateImage as rotateImageUtil,
  loadImage,
  canvasToBlob,
  type ImageFormat,
} from "./image-utils";

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

// ... other functions like processImageForStats, calculateImageStats, estimateFileSize, downloadProcessedImage ...

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

    // RESET filter so other operations (like toBlob) aren’t affected
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
