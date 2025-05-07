export type EditorMode = "view" | "edit" | "crop" | "blur" | "paint";

export interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface PaintToolRef {
  getCanvasDataUrl: () => string | null;
}

export interface BlurBrushCanvasRef {
  getCanvasDataUrl: () => string | null;
}
