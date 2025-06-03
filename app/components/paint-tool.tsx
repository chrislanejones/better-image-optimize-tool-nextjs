// app/components/paint-tool.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Eraser,
  Paintbrush,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Smile,
  MoveUpRight,
} from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import type { PaintToolProps, PaintToolRef } from "@/types/types";

const colorPalette = [
  "#ff0000",
  "#e51e25",
  "#a61b29",
  "#8d4bbb",
  "#ff7f00",
  "#ff8c00",
  "#ff4500",
  "#ffa500",
  "#ffff00",
  "#ffd700",
  "#ffc72c",
  "#fbec5d",
  "#00ff00",
  "#32cd32",
  "#008000",
  "#00a550",
  "#0000ff",
  "#1e90ff",
  "#5f9ea0",
  "#00bfff",
  "#800080",
  "#9370db",
  "#8a2be2",
  "#9b30ff",
  "#ffffff",
  "#d3d3d3",
  "#808080",
  "#000000",
];

const PaintTool = forwardRef<PaintToolRef, PaintToolProps>(
  ({ imageUrl, onApplyPaint, onCancel }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    // History
    const historyRef = useRef<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Tool state
    const [tool, setTool] = useState<
      "brush" | "eraser" | "emoji" | "arrow" | "doubleArrow"
    >("brush");
    const [brushColor, setBrushColor] = useState("#ff0000");
    const [brushSize, setBrushSize] = useState(10);

    // Emoji state
    const [selectedEmoji, setSelectedEmoji] = useState("😀");
    const [emojiSize, setEmojiSize] = useState(40);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Drawing/arrow
    const [isDrawing, setIsDrawing] = useState(false);
    const [arrowStart, setArrowStart] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // Initialize canvas and history
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctxRef.current = ctx;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        historyRef.current = [snap];
        setHistoryIndex(0);
      };
    }, [imageUrl]);

    // Update stroke style
    useEffect(() => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation =
        tool === "eraser" ? "destination-out" : "source-over";
      if (tool !== "eraser") {
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
      }
    }, [tool, brushColor, brushSize]);

    // Snapshot history
    const saveState = useCallback(() => {
      const canvas = canvasRef.current!;
      const ctx = ctxRef.current!;
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyRef.current = historyRef.current.slice(0, historyIndex + 1);
      historyRef.current.push(snap);
      setHistoryIndex(historyRef.current.length - 1);
    }, [historyIndex]);

    // Undo/redo
    const undo = useCallback(() => {
      if (historyIndex <= 0) return;
      const ctx = ctxRef.current!;
      const ni = historyIndex - 1;
      ctx.putImageData(historyRef.current[ni], 0, 0);
      setHistoryIndex(ni);
    }, [historyIndex]);

    const redo = useCallback(() => {
      if (historyIndex >= historyRef.current.length - 1) return;
      const ctx = ctxRef.current!;
      const ni = historyIndex + 1;
      ctx.putImageData(historyRef.current[ni], 0, 0);
      setHistoryIndex(ni);
    }, [historyIndex]);

    // Arrow helper
    const drawArrow = useCallback(
      (fx: number, fy: number, tx: number, ty: number, doubleHead = false) => {
        const ctx = ctxRef.current!;
        const headLen = brushSize * 3;
        const angle = Math.atan2(ty - fy, tx - fx);
        const hA = Math.PI / 6;

        ctx.save();
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";

        // shaft
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // head at tip
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx - headLen * Math.cos(angle - hA),
          ty - headLen * Math.sin(angle - hA)
        );
        ctx.lineTo(
          tx - headLen * Math.cos(angle + hA),
          ty - headLen * Math.sin(angle + hA)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // head at base
        if (doubleHead) {
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(
            fx + headLen * Math.cos(angle - hA),
            fy + headLen * Math.sin(angle - hA)
          );
          ctx.lineTo(
            fx + headLen * Math.cos(angle + hA),
            fy + headLen * Math.sin(angle + hA)
          );
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      },
      [brushSize]
    );

    // Convert mouse to canvas coords
    const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * canvas.width) / rect.width,
        y: ((e.clientY - rect.top) * canvas.height) / rect.height,
      };
    };

    // Mouse events
    const start = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        const ctx = ctxRef.current!;
        const { x, y } = getPos(e);
        if (tool === "emoji") {
          ctx.font = `${emojiSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(selectedEmoji, x, y);
          saveState();
          return;
        }
        if (tool === "arrow" || tool === "doubleArrow") {
          setArrowStart({ x, y });
          setIsDrawing(true);
          return;
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
      },
      [tool, selectedEmoji, emojiSize, saveState]
    );

    const move = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const ctx = ctxRef.current!;
        const { x, y } = getPos(e);
        if (tool === "brush" || tool === "eraser") {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      },
      [isDrawing, tool]
    );

    const end = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (tool === "arrow" || tool === "doubleArrow") {
          const sp = arrowStart!;
          const { x, y } = getPos(e);
          drawArrow(sp.x, sp.y, x, y, tool === "doubleArrow");
          saveState();
          setArrowStart(null);
        } else if (tool !== "emoji") {
          ctxRef.current!.closePath();
          saveState();
        }
        setIsDrawing(false);
      },
      [tool, arrowStart, drawArrow, saveState]
    );

    // Correct signature: (data, event)
    const handleEmojiClick = useCallback(
      (_emoji: EmojiClickData, _event: MouseEvent) => {
        setSelectedEmoji(_emoji.emoji);
      },
      []
    );

    // Expose methods
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: () => canvasRef.current?.toDataURL() || null,
      clear: () => {
        const canvas = canvasRef.current!;
        const ctx = ctxRef.current!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
          historyRef.current = [snap];
          setHistoryIndex(0);
        };
      },
    }));

    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Canvas */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <canvas
            ref={canvasRef}
            onMouseDown={start}
            onMouseMove={move}
            onMouseUp={end}
            onMouseLeave={end}
            className="w-full cursor-crosshair"
          />
        </div>

        {/* Tools */}
        <div className="bg-gray-800 p-4 rounded-lg space-y-4 text-white">
          {/* Undo/Redo */}
          <div className="flex justify-between">
            <h3 className="text-lg">Paint Tools</h3>
            <div className="flex space-x-2">
              <Button
                onClick={undo}
                disabled={historyIndex <= 0}
                variant="outline"
              >
                <UndoIcon />
              </Button>
              <Button
                onClick={redo}
                disabled={historyIndex >= historyRef.current.length - 1}
                variant="outline"
              >
                <RedoIcon />
              </Button>
            </div>
          </div>

          {/* Tool Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <Button
              onClick={() => setTool("brush")}
              variant={tool === "brush" ? "default" : "outline"}
              className="h-12 flex items-center justify-center gap-2"
            >
              <Paintbrush /> Brush
            </Button>
            <Button
              onClick={() => setTool("eraser")}
              variant={tool === "eraser" ? "default" : "outline"}
              className="h-12 flex items-center justify-center gap-2"
            >
              <Eraser /> Eraser
            </Button>
            <Button
              onClick={() => {
                setTool("emoji");
                setShowEmojiPicker(true);
              }}
              variant={tool === "emoji" ? "default" : "outline"}
              className="h-12 flex items-center justify-center gap-2"
            >
              <Smile /> Emoji
            </Button>
            <Button
              onClick={() => setTool("arrow")}
              variant={tool === "arrow" ? "default" : "outline"}
              className="h-12 flex items-center justify-center gap-2"
            >
              <MoveUpRight /> Arrow
            </Button>
            <Button
              onClick={() => setTool("doubleArrow")}
              variant={tool === "doubleArrow" ? "default" : "outline"}
              className="h-12 flex items-center justify-center gap-2"
            >
              <MoveUpRight style={{ transform: "rotate(180deg)" }} /> Double
            </Button>
          </div>

          {/* Emoji Picker */}
          {tool === "emoji" && (
            <div className="mt-4 w-full bg-gray-700 p-3 rounded-md">
              <div className="flex justify-between mb-2">
                <span>
                  Selected: <span className="text-xl">{selectedEmoji}</span>
                </span>
                <Button
                  size="sm"
                  variant={showEmojiPicker ? "default" : "outline"}
                  onClick={() => setShowEmojiPicker((v) => !v)}
                >
                  {showEmojiPicker ? "Hide Picker" : "Show Picker"}
                </Button>
              </div>

              {showEmojiPicker && (
                <div className="h-96 overflow-auto border rounded mb-4">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width="100%"
                    height={500}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block">Emoji Size: {emojiSize}px</label>
                <Slider
                  min={10}
                  max={200}
                  step={2}
                  value={[emojiSize]}
                  onValueChange={(v) => setEmojiSize(v[0])}
                />
                <div
                  className="mt-2 text-center"
                  style={{ fontSize: `${emojiSize}px` }}
                >
                  {selectedEmoji}
                </div>
              </div>
            </div>
          )}

          {/* Brush/Eraser/Arrow Size */}
          {(tool === "brush" ||
            tool === "eraser" ||
            tool === "arrow" ||
            tool === "doubleArrow") && (
            <div className="space-y-2">
              <label className="block">Size: {brushSize}px</label>
              <Slider
                min={1}
                max={50}
                step={1}
                value={[brushSize]}
                onValueChange={(v) => setBrushSize(v[0])}
              />
            </div>
          )}

          {/* Color Palette */}
          {(tool === "brush" || tool === "arrow" || tool === "doubleArrow") && (
            <div className="space-y-2">
              <label className="block">Color</label>
              <div className="grid grid-cols-8 gap-1">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded ${
                      brushColor === c ? "ring-2 ring-white" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setBrushColor(c)}
                  />
                ))}
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 p-0 border-none"
                />
                <span className="ml-2 font-mono text-xs">{brushColor}</span>
              </div>
            </div>
          )}

          {/* Clear / Cancel / Apply */}
          <div className="flex justify-between mt-4">
            <Button
              variant="destructive"
              onClick={() => {
                const c = canvasRef.current!,
                  ctx = ctxRef.current!;
                ctx.clearRect(0, 0, c.width, c.height);
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = imageUrl;
                img.onload = () => {
                  ctx.drawImage(img, 0, 0);
                  const snap = ctx.getImageData(0, 0, c.width, c.height);
                  historyRef.current = [snap];
                  setHistoryIndex(0);
                };
              }}
            >
              Clear
            </Button>
            <div className="space-x-2">
              <Button onClick={onCancel} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const url = canvasRef.current?.toDataURL() || "";
                  onApplyPaint(url);
                }}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PaintTool.displayName = "PaintTool";
export default PaintTool;
