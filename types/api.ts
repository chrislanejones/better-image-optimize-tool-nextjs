import type { ImageFile } from "./image";

export interface OptimizeApiRequest {
  image: ImageFile;
  options: {
    quality: number;
    format: "jpeg" | "png" | "webp" | "avif";
  };
}

export interface OptimizeApiResponse {
  success: boolean;
  optimizedImage?: ImageFile;
  error?: string;
}
