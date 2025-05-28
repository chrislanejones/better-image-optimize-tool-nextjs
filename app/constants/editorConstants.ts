// constants/editorConstants.ts
import type { EditorState } from "@/types/types";

// Default values
export const DEFAULT_VALUES = {
  zoom: 1,
  blurAmount: 5,
  blurRadius: 10,
  brushSize: 10,
  brushColor: "#ff0000",
  format: "webp",
  quality: 85,
  compressionLevel: "medium",
} as const;

// Image format options
export const IMAGE_FORMATS = [
  { value: "jpeg", label: "JPEG", description: "Best for photos" },
  {
    value: "png",
    label: "PNG",
    description: "Best for images with transparency",
  },
  {
    value: "webp",
    label: "WebP",
    description: "Modern format with best compression",
  },
] as const;

// Compression levels
export const COMPRESSION_LEVELS = [
  {
    value: "low",
    label: "Low",
    quality: 95,
    description: "Larger file, better quality",
  },
  { value: "medium", label: "Medium", quality: 85, description: "Balanced" },
  {
    value: "high",
    label: "High",
    quality: 75,
    description: "Smaller file, good quality",
  },
  {
    value: "extreme",
    label: "Extreme",
    quality: 60,
    description: "Smallest file",
  },
] as const;

// Core Web Vitals thresholds
export const CORE_WEB_VITALS = {
  LCP_THRESHOLD_GOOD: 1200 * 900, // ~1MP is good for Largest Contentful Paint
  LCP_THRESHOLD_POOR: 1800 * 1200, // ~2.2MP is poor for LCP
  BUFFER: 20000, // ~20k pixels buffer for scoring
} as const;

// Tool configuration
export const TOOL_CONFIG = {
  blur: {
    minAmount: 1,
    maxAmount: 20,
    minRadius: 5,
    maxRadius: 50,
  },
  brush: {
    minSize: 1,
    maxSize: 50,
  },
  text: {
    minSize: 8,
    maxSize: 72,
    defaultFont: "Arial",
  },
  zoom: {
    min: 0.5,
    max: 3,
    step: 0.1,
  },
} as const;

// Animation durations
export const ANIMATIONS = {
  padlockDuration: 600,
  compressionDelay: 800,
  toastDuration: 3000,
} as const;

// File size limits
export const FILE_LIMITS = {
  maxSizeBeforeCompression: 2 * 1024 * 1024, // 2MB
  targetCompressionSize: 500 * 1024, // 500KB
} as const;
