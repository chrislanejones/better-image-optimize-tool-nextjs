// app/utils/image-processing.ts
import { loadImage, canvasToBlob, getMimeType } from "./image-utils";
import type { ImageFormat } from "@/types/types";

/**
 * Compress an image, with optional true B&W thresholding.
 */
export async function compressImageAggressively(
  url: string,
  maxWidth = 1200,
  format: ImageFormat | string = "webp",
  targetSizeKB = 500,
  compressionLevel:
    | "low"
    | "medium"
    | "high"
    | "extremeSmall"
    | "extremeBW" = "medium"
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

  // initial quality by level
  let quality =
    compressionLevel === "low"
      ? 0.95
      : compressionLevel === "medium"
      ? 0.85
      : compressionLevel === "high"
      ? 0.75
      : compressionLevel === "extremeSmall"
      ? 0.6
      : 0.85;

  // downscale if too wide
  if (width > maxWidth) {
    const r = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * r);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");

  let resultBlob: Blob;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    canvas.width = width;
    canvas.height = height;

    if (compressionLevel === "extremeBW") {
      // 1. draw grayscale
      ctx.filter = "grayscale(100%)";
      ctx.drawImage(img, 0, 0, width, height);
      ctx.filter = "none";

      // 2. threshold to B&W
      const data = ctx.getImageData(0, 0, width, height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const bw = d[i] < 128 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = bw;
      }
      ctx.putImageData(data, 0, 0);
    } else {
      ctx.filter = "none";
      ctx.drawImage(img, 0, 0, width, height);
    }

    resultBlob = await canvasToBlob(canvas, format, quality);
    const sizeKB = resultBlob.size / 1024;
    if (sizeKB <= targetSizeKB || attempts >= maxAttempts) break;

    quality = Math.max(0.1, quality * 0.8);
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

/**
 * Rotate an image any angle.
 */
export async function rotateImage(
  imageUrl: string,
  degrees: number,
  format: ImageFormat | string = "jpeg",
  quality = 0.85
): Promise<string> {
  const img = await loadImage(imageUrl);
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad)),
    cos = Math.abs(Math.cos(rad));
  const w = Math.floor(img.width * cos + img.height * sin);
  const h = Math.floor(img.width * sin + img.height * cos);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");
  canvas.width = w;
  canvas.height = h;

  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL(getMimeType(format), quality);
}

/**
 * Flip horizontally or vertically.
 */
export async function flipImage(
  imageUrl: string,
  horizontal = true,
  format: ImageFormat | string = "jpeg",
  quality = 0.85
): Promise<string> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get 2D context");
  canvas.width = img.width;
  canvas.height = img.height;

  if (horizontal) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
  }
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL(getMimeType(format), quality);
}
