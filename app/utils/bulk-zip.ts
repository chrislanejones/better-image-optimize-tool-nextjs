// app/utils/bulk-zip.ts
import JSZip from "jszip";
import type { PixelCrop } from "react-image-crop";
import type { ImageFormat } from "@/types/types";
import { bulkCropImages } from "./image-utils";

export async function zipAndDownloadBlobs(
  files: Array<{ name: string; blob: Blob }>,
  zipFileName: string,
  onProgress?: (percent: number) => void
) {
  const zip = new JSZip();

  // add each file
  for (let i = 0; i < files.length; i++) {
    const { name, blob } = files[i];
    zip.file(name, blob);
    onProgress?.(Math.round(((i + 1) / files.length) * 50));
  }

  // generate the zip, with progress
  const zipBlob = await zip.generateAsync({ type: "blob" }, (meta) =>
    onProgress?.(50 + Math.round(meta.percent / 2))
  );

  // trigger download
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  onProgress?.(100);
}

/**
 * Bulk‐crop & zip helper.
 */
export async function bulkProcessAndZip(
  imageUrls: string[],
  pixelCrop: PixelCrop,
  format: ImageFormat,
  quality: number,
  zipName: string,
  onProgress?: (
    stage: "cropping" | "zipping" | "done",
    percent: number,
    current: number,
    total: number
  ) => void
) {
  // Stage 1: crop to blobs
  const blobs = await bulkCropImages(
    imageUrls,
    {
      x: pixelCrop.x,
      y: pixelCrop.y,
      width: pixelCrop.width,
      height: pixelCrop.height,
      unit: "px",
    },
    format,
    quality,
    (pct, cur, tot) => {
      onProgress?.("cropping", pct, cur, tot);
    }
  );

  // Stage 2: zip + download
  const files = blobs.map(({ blob, fileName }) => ({ name: fileName, blob }));
  onProgress?.("zipping", 0, files.length, files.length);
  await zipAndDownloadBlobs(files, zipName, (pct) =>
    onProgress?.("zipping", pct, files.length, files.length)
  );

  onProgress?.("done", 100, files.length, files.length);
}
