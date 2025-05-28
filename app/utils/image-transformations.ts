// Fixed image-transformations.ts with TypeScript errors resolved
"use client";

import { PixelCrop } from "react-image-crop";
import { getMimeType, getFileFormat } from "./image-utils";

/**
 * Apply crop to an image and return the result as a URL with proper compression
 */
export const cropImage = (
  image: HTMLImageElement,
  crop: PixelCrop,
  format: string = "jpeg",
  quality: number = 0.9
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

    // Convert quality from 0-100 to 0-1 range if it's over 1
    const normalizedQuality = quality > 1 ? quality / 100 : quality;

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
      normalizedQuality // Use normalized quality
    );
  });
};

/**
 * Rotate an image by a given degree clockwise and return a data URL.
 */
export async function rotateImage(
  imageUrl: string,
  degrees: number,
  format: string = "image/jpeg",
  quality: number = 0.85
): Promise<string> {
  const img = await loadImage(imageUrl);
  const radians = (degrees * Math.PI) / 180;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to get canvas context");

  // Set canvas size to fit rotated image
  if (degrees % 180 === 0) {
    canvas.width = img.width;
    canvas.height = img.height;
  } else {
    canvas.width = img.height;
    canvas.height = img.width;
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL(format, quality);
}

/**
 * Load an image from a URL into an HTMLImageElement.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Resize an image and return the result as a URL with proper compression
 */
export const resizeImage = (
  image: HTMLImageElement,
  width: number,
  height: number,
  format: string = "jpeg",
  quality: number = 85 // Default quality as 0-100 value
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create the main canvas for resizing
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Normalize quality to 0-1 range
      const normalizedQuality = quality > 1 ? quality / 100 : quality;

      console.log(
        `Resizing image to ${width}x${height} with format ${format} and quality ${normalizedQuality}`
      );

      // Use multiple passes for higher quality downsampling when reducing significantly
      const resizeWithQuality = (
        img: HTMLImageElement,
        targetWidth: number,
        targetHeight: number
      ) => {
        // If we're not reducing by much, just resize directly
        if (img.width < targetWidth * 1.5 && img.height < targetHeight * 1.5) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          return;
        }

        // For larger reductions, use multiple passes
        let currentWidth = img.width;
        let currentHeight = img.height;

        // Intermediate canvas for multi-step resizing
        const intermediateCanvas = document.createElement("canvas");
        const intermediateCtx = intermediateCanvas.getContext("2d");

        if (!intermediateCtx) {
          // Fallback to simple resize if we can't create the intermediate
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          return;
        }

        // Start with the original image
        let currentImg: HTMLImageElement | HTMLCanvasElement = img;

        // Perform step-by-step downsizing
        while (
          currentWidth > targetWidth * 1.5 ||
          currentHeight > targetHeight * 1.5
        ) {
          // Reduce by 50% each step
          currentWidth = Math.max(currentWidth * 0.5, targetWidth);
          currentHeight = Math.max(currentHeight * 0.5, targetHeight);

          intermediateCanvas.width = currentWidth;
          intermediateCanvas.height = currentHeight;

          // Apply high-quality resizing algorithm
          intermediateCtx.imageSmoothingEnabled = true;
          intermediateCtx.imageSmoothingQuality = "high";
          intermediateCtx.drawImage(
            currentImg,
            0,
            0,
            currentWidth,
            currentHeight
          );

          // For the next iteration, use this image
          currentImg = intermediateCanvas;
        }

        // Final resize to exact dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(currentImg, 0, 0, targetWidth, targetHeight);
      };

      // Perform the resize operation
      resizeWithQuality(image, width, height);

      // Apply format-specific optimizations
      // Create a variable for adjusted quality
      let adjustedQuality = normalizedQuality;

      if (format === "jpeg") {
        // Apply a slight blur for jpeg to reduce artifacts and file size
        if (normalizedQuality < 0.8) {
          ctx.filter = `blur(0.5px)`;
          ctx.drawImage(canvas, 0, 0, width, height);
          ctx.filter = "none";
        }
      } else if (format === "webp") {
        // For WebP, we can afford to reduce quality slightly as it preserves better visual quality
        adjustedQuality = Math.min(normalizedQuality, 0.85);
      }

      console.log(
        `Creating blob with format ${getMimeType(
          format
        )} and quality ${adjustedQuality}`
      );

      // Convert canvas to blob and create URL
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas to Blob conversion failed"));
            return;
          }

          console.log(
            `Generated blob of size ${(blob.size / 1024).toFixed(2)} KB`
          );

          // Check if the blob size is too large (>2MB) and further reduce quality if needed
          if (blob.size > 2 * 1024 * 1024 && format !== "png") {
            const reducedQuality = adjustedQuality * 0.7;
            console.log(
              `Blob too large, reducing quality to ${reducedQuality}`
            );

            canvas.toBlob(
              (reducedBlob) => {
                if (!reducedBlob) {
                  reject(new Error("Secondary compression failed"));
                  return;
                }
                console.log(
                  `Reduced blob size to ${(reducedBlob.size / 1024).toFixed(
                    2
                  )} KB`
                );
                const url = URL.createObjectURL(reducedBlob);
                resolve(url);
              },
              getMimeType(format),
              reducedQuality
            );
          } else {
            const url = URL.createObjectURL(blob);
            resolve(url);
          }
        },
        getMimeType(format),
        adjustedQuality
      );
    } catch (error) {
      console.error("Error resizing image:", error);
      reject(error);
    }
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
 * Normalize quality value to ensure it's in 0-1 range
 */
export const normalizeQuality = (quality: number): number => {
  if (quality > 1) return quality / 100;
  return Math.max(0, Math.min(1, quality));
};

/**
 * Apply proper compression to an image and return as a URL
 * @param imgSrc Source image URL
 * @param format Output format (jpeg, png, webp)
 * @param quality Quality from 0-100
 * @param maxWidth Optional maximum width to resize to
 */
export const compressImage = async (
  imgSrc: string,
  format: string = "webp",
  quality: number = 85,
  maxWidth?: number
): Promise<{ url: string; blob: Blob; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Calculate dimensions preserving aspect ratio
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        if (maxWidth && width > maxWidth) {
          const ratio = maxWidth / width;
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        // Create canvas and draw image
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Draw with high quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Normalize quality to 0-1 scale
        const normalizedQuality = quality > 1 ? quality / 100 : quality;

        console.log(
          `Compressing to ${format} at quality ${normalizedQuality}, dimensions: ${width}x${height}`
        );

        // Convert to blob with quality parameter
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }

            console.log(
              `Generated compressed blob of size ${(blob.size / 1024).toFixed(
                2
              )} KB`
            );

            // Additional compression for large blobs
            if (blob.size > 1.5 * 1024 * 1024 && format !== "png") {
              // Try again with lower quality for large files
              const lowerQuality = normalizedQuality * 0.7;
              console.log(
                `Blob still large, reducing quality to ${lowerQuality}`
              );

              canvas.toBlob(
                (reducedBlob) => {
                  if (!reducedBlob) {
                    reject(new Error("Secondary compression failed"));
                    return;
                  }

                  console.log(
                    `Further reduced blob size to ${(
                      reducedBlob.size / 1024
                    ).toFixed(2)} KB`
                  );
                  const url = URL.createObjectURL(reducedBlob);
                  resolve({ url, blob: reducedBlob, width, height });
                },
                getMimeType(format),
                lowerQuality
              );
            } else {
              const url = URL.createObjectURL(blob);
              resolve({ url, blob, width, height });
            }
          },
          getMimeType(format),
          normalizedQuality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = imgSrc;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Create a download link for an image
 * @param url URL of the image to download
 * @param fileName Name to save the file as
 * @param format Format of the image (jpeg, png, webp)
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

/**
 * Get a blob from a URL (dataURL or objectURL)
 */
export const getBlobFromUrl = async (url: string): Promise<Blob> => {
  // Handle data URLs directly
  if (url.startsWith("data:")) {
    const response = await fetch(url);
    return await response.blob();
  }

  // Handle object URLs or regular URLs
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => resolve(blob))
      .catch((error) => reject(error));
  });
};

/**
 * Apply forceful compression to an image regardless of format
 * This is designed to always get a smaller file size by sacrificing some quality
 */
export const forceCompressImage = async (
  imageUrl: string,
  targetSizeKB: number = 500, // Target size in KB
  format: string = "webp"
): Promise<{
  url: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
}> => {
  // Start with a default quality level
  let quality = format === "webp" ? 80 : 85;
  let attempts = 0;
  let maxAttempts = 5;
  let resultBlob: Blob | null = null;
  let width: number;
  let height: number;

  const img = new Image();
  img.crossOrigin = "anonymous";

  // Wait for image to load
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });

  width = img.naturalWidth;
  height = img.naturalHeight;

  // If dimensions are large, scale down first
  const maxDimension = 1800; // Maximum dimension to allow
  let scaleFactor = 1;

  if (width > maxDimension || height > maxDimension) {
    scaleFactor = maxDimension / Math.max(width, height);
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
  }

  // Draw image to canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Try compressing with decreasing quality until target size is reached
  while (attempts < maxAttempts) {
    attempts++;

    // Convert quality to 0-1 scale
    const normalizedQuality = quality / 100;

    console.log(
      `Compression attempt ${attempts}: format=${format}, quality=${quality}, size=${width}x${height}`
    );

    try {
      resultBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob"));
              return;
            }
            resolve(blob);
          },
          getMimeType(format),
          normalizedQuality
        );
      });
    } catch (error) {
      console.error("Error creating blob:", error);
      throw error;
    }

    if (!resultBlob) {
      throw new Error("Failed to create blob");
    }

    const currentSizeKB = resultBlob.size / 1024;
    console.log(
      `Generated blob size: ${currentSizeKB.toFixed(
        2
      )} KB (target: ${targetSizeKB} KB)`
    );

    // If we reached our target size or can't reduce quality further, break
    if (currentSizeKB <= targetSizeKB || quality <= 30) {
      break;
    }

    // Reduce quality for next attempt
    quality = Math.max(30, quality - 15);

    // If still too large after reducing quality, start reducing dimensions
    if (attempts >= 3 && currentSizeKB > targetSizeKB * 1.5) {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);

      // Redraw at smaller size
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      console.log(`Reduced dimensions to ${width}x${height}`);
    }
  }

  if (!resultBlob) {
    throw new Error("Failed to compress image");
  }

  // Create a URL from the final blob
  const url = URL.createObjectURL(resultBlob);
  return {
    url,
    blob: resultBlob,
    size: resultBlob.size,
    width,
    height,
  };
};
