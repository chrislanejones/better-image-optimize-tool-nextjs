"use client";

// Function to determine brightness of a color for contrast
const getBrightness = (color: string): number => {
  // Convert hex to RGB
  let r, g, b;
  if (color.startsWith("#")) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  } else {
    // Set defaults if color format is not recognized
    r = 0;
    g = 0;
    b = 0;
  }

  // Calculate brightness using the formula: (0.299*R + 0.587*G + 0.114*B)
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Eraser,
  Paintbrush,
  Undo,
  Redo,
  Smile,
  MoveUpRight,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

interface PaintToolProps {
  imageUrl: string;
  onApplyPaint: (paintedImageUrl: string) => void;
  onCancel: () => void;
}

export interface PaintToolRef {
  getCanvasDataUrl: () => string | null;
  clear: () => void;
}

const colorPalette = [
  // Reds
  "#ff0000",
  "#e51e25",
  "#a61b29",
  "#8d4bbb",
  // Oranges
  "#ff7f00",
  "#ff8c00",
  "#ff4500",
  "#ffa500",
  // Yellows
  "#ffff00",
  "#ffd700",
  "#ffc72c",
  "#fbec5d",
  // Greens
  "#00ff00",
  "#32cd32",
  "#008000",
  "#00a550",
  // Blues
  "#0000ff",
  "#1e90ff",
  "#5f9ea0",
  "#00bfff",
  // Purples
  "#800080",
  "#9370db",
  "#8a2be2",
  "#9b30ff",
  // Blacks/Whites
  "#ffffff",
  "#d3d3d3",
  "#808080",
  "#000000",
];

const PaintTool = forwardRef<PaintToolRef, PaintToolProps>(
  ({ imageUrl, onApplyPaint, onCancel }, ref) => {
    // State
    const [brushColor, setBrushColor] = useState<string>("#ff0000");
    const [brushSize, setBrushSize] = useState<number>(10);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [tool, setTool] = useState<
      "brush" | "eraser" | "emoji" | "arrow" | "doubleArrow"
    >("brush");
    const [selectedEmoji, setSelectedEmoji] = useState<string>("😀");
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
    const [arrowStart, setArrowStart] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);

    // Initialize canvas with image
    useEffect(() => {
      if (!canvasRef.current || !imageUrl) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      contextRef.current = ctx;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imageUrl;

      img.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);

        // Add initial state to history
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([imageData]);
        setHistoryIndex(0);
      };
    }, [imageUrl]);

    // Update brush properties when they change
    useEffect(() => {
      if (!contextRef.current) return;

      if (tool === "eraser") {
        contextRef.current.globalCompositeOperation = "destination-out";
      } else {
        contextRef.current.globalCompositeOperation = "source-over";
        contextRef.current.strokeStyle = brushColor;
      }

      contextRef.current.lineWidth = brushSize;
      contextRef.current.lineCap = "round";
      contextRef.current.lineJoin = "round";
    }, [tool, brushColor, brushSize]);

    // Save state for undo/redo functionality
    const saveState = useCallback(() => {
      if (!canvasRef.current || !contextRef.current) return;

      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Create a copy of the current canvas state
      const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // If we're not at the end of history, remove everything after current index
      const newHistory = history.slice(0, historyIndex + 1);

      // Add new state and update index
      setHistory([...newHistory, currentState]);
      setHistoryIndex(newHistory.length);
    }, [history, historyIndex]);

    // Undo function
    const handleUndo = useCallback(() => {
      if (historyIndex <= 0 || !contextRef.current || !canvasRef.current)
        return;

      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);

      // Apply the previous state
      contextRef.current.putImageData(history[newIndex], 0, 0);
    }, [history, historyIndex]);

    // Redo function
    const handleRedo = useCallback(() => {
      if (
        historyIndex >= history.length - 1 ||
        !contextRef.current ||
        !canvasRef.current
      )
        return;

      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);

      // Apply the next state
      contextRef.current.putImageData(history[newIndex], 0, 0);
    }, [history, historyIndex]);

    // Drawing functions
    const drawArrow = useCallback(
      (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        isDouble: boolean = false
      ) => {
        if (!contextRef.current) return;

        const ctx = contextRef.current;
        const headLength = 20; // length of arrow head
        const headAngle = Math.PI / 8; // angle of arrow head
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Save current style
        ctx.save();

        // Set arrow style
        ctx.strokeStyle = brushColor;
        ctx.fillStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "butt";
        ctx.lineJoin = "miter";

        // Draw the line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw the arrow head at the end (pointing away from start)
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(
          toX - headLength * Math.cos(angle - headAngle),
          toY - headLength * Math.sin(angle - headAngle)
        );
        ctx.lineTo(
          toX - headLength * Math.cos(angle + headAngle),
          toY - headLength * Math.sin(angle + headAngle)
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw the arrow head at the start if double arrow (pointing away from end)
        if (isDouble) {
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(
            fromX + headLength * Math.cos(angle - headAngle),
            fromY + headLength * Math.sin(angle - headAngle)
          );
          ctx.lineTo(
            fromX + headLength * Math.cos(angle + headAngle),
            fromY + headLength * Math.sin(angle + headAngle)
          );
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Restore style
        ctx.restore();
      },
      [brushColor, brushSize]
    );

    const startDrawing = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!contextRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (tool === "emoji") {
          // Draw emoji at the position
          contextRef.current.font = `${brushSize * 2}px Arial`;
          contextRef.current.textAlign = "center";
          contextRef.current.textBaseline = "middle";
          contextRef.current.fillText(selectedEmoji, x, y);

          // Save state after emoji is placed
          saveState();
        } else if (tool === "arrow" || tool === "doubleArrow") {
          // Start arrow drawing
          setArrowStart({ x, y });
          setIsDrawing(true);
        } else {
          contextRef.current.beginPath();
          contextRef.current.moveTo(x, y);
          setIsDrawing(true);
        }
      },
      [tool, selectedEmoji, brushSize, saveState]
    );

    const draw = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (
          !isDrawing ||
          !contextRef.current ||
          !canvasRef.current ||
          tool === "emoji"
        )
          return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (tool === "arrow" || tool === "doubleArrow") {
          // For arrow tool, we don't draw while moving, just track the position
          return;
        }

        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
      },
      [isDrawing, tool]
    );

    const finishDrawing = useCallback(
      (e?: React.MouseEvent<HTMLCanvasElement>) => {
        if (!contextRef.current || tool === "emoji") return;

        if (
          (tool === "arrow" || tool === "doubleArrow") &&
          arrowStart &&
          e &&
          canvasRef.current
        ) {
          // Draw the arrow from start to end position
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          const endX = (e.clientX - rect.left) * scaleX;
          const endY = (e.clientY - rect.top) * scaleY;

          drawArrow(
            arrowStart.x,
            arrowStart.y,
            endX,
            endY,
            tool === "doubleArrow"
          );
          setArrowStart(null);
        } else if (tool !== "arrow" && tool !== "doubleArrow") {
          contextRef.current.closePath();
        }

        setIsDrawing(false);

        // Save state after drawing is complete
        saveState();
      },
      [saveState, tool, arrowStart, drawArrow]
    );

    // Toggle tool function
    const toggleTool = useCallback(
      (newTool: "brush" | "eraser" | "emoji" | "arrow" | "doubleArrow") => {
        setTool(newTool);

        // If switching to emoji tool, show the emoji picker
        if (newTool === "emoji") {
          setShowEmojiPicker(true);
        }

        // Clear arrow start if switching away from arrow tool
        if (newTool !== "arrow" && newTool !== "doubleArrow") {
          setArrowStart(null);
        }
      },
      []
    );

    // Handle emoji selection
    const handleEmojiSelect = (emojiData: any) => {
      setSelectedEmoji(emojiData.emoji);
      setShowEmojiPicker(false);
    };

    // Clear the canvas back to original image
    const clear = useCallback(() => {
      if (!canvasRef.current || !contextRef.current) return;

      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the original image again
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, 0, 0);

        // Reset history
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([imageData]);
        setHistoryIndex(0);
      };
      img.src = imageUrl;
    }, [imageUrl]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: () => {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL("image/jpeg", 0.9);
        } catch (err) {
          console.error("Failed to get canvas data", err);
          return null;
        }
      },
      clear,
    }));

    return (
      <div className="grid grid-cols-2 gap-2">
        {/* Canvas Column */}
        <div className="col-1 bg-gray-800 rounded-lg p-4">
          <div className="relative border rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={finishDrawing}
              onMouseMove={draw}
              onMouseLeave={(e) => {
                if ((tool === "arrow" || tool === "doubleArrow") && isDrawing) {
                  finishDrawing(e);
                } else {
                  finishDrawing();
                }
              }}
              className="w-full h-auto cursor-crosshair"
            />
          </div>
        </div>

        {/* Tools Column */}
        <div className="col-1 flex flex-col gap-4 bg-gray-800 rounded-lg p-4">
          {/* Header + Undo/Redo */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Paint Tools</h3>
            <div className="flex space-x-2">
              <Button
                onClick={handleUndo}
                variant="secondary"
                className="h-9 w-9 p-0"
                disabled={historyIndex <= 0}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleRedo}
                variant="secondary"
                className="h-9 w-9 p-0"
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
              <Button onClick={clear} variant="destructive" size="sm">
                Clear
              </Button>
            </div>
          </div>

          {/* Tool Selection */}
          <div className="grid grid-cols-5 gap-2">
            <Button
              onClick={() => toggleTool("brush")}
              variant={tool === "brush" ? "default" : "outline"}
              className={`flex items-center justify-center h-12 ${
                tool === "brush" ? "bg-blue-600" : ""
              }`}
            >
              <Paintbrush className="mr-2 h-5 w-5" />
              Brush
            </Button>
            <Button
              onClick={() => toggleTool("eraser")}
              variant={tool === "eraser" ? "default" : "outline"}
              className={`flex items-center justify-center h-12 ${
                tool === "eraser" ? "bg-blue-600" : ""
              }`}
            >
              <Eraser className="mr-2 h-5 w-5" />
              Eraser
            </Button>
            <Button
              onClick={() => toggleTool("emoji")}
              variant={tool === "emoji" ? "default" : "outline"}
              className={`flex items-center justify-center h-12 ${
                tool === "emoji" ? "bg-blue-600" : ""
              }`}
            >
              <Smile className="mr-2 h-5 w-5" />
              Emoji
            </Button>
            <Button
              onClick={() => toggleTool("arrow")}
              variant={tool === "arrow" ? "default" : "outline"}
              className={`flex items-center justify-center h-12 ${
                tool === "arrow" ? "bg-blue-600" : ""
              }`}
            >
              <MoveUpRight className="mr-2 h-5 w-5" />
              Arrow
            </Button>
            <Button
              onClick={() => toggleTool("doubleArrow")}
              variant={tool === "doubleArrow" ? "default" : "outline"}
              className={`flex items-center justify-center h-12 ${
                tool === "doubleArrow" ? "bg-blue-600" : ""
              }`}
            >
              <span className="mr-2 text-base font-bold">↔</span>
              Double
            </Button>
          </div>

          {/* Emoji Picker */}
          {tool === "emoji" && (
            <div className="bg-gray-700 p-3 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-white">
                  Selected: <span className="text-xl">{selectedEmoji}</span>
                </h4>
                <Button
                  size="sm"
                  variant={showEmojiPicker ? "default" : "outline"}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {showEmojiPicker ? "Hide Picker" : "Show Picker"}
                </Button>
              </div>

              {showEmojiPicker && (
                <div className="mt-2 mb-4 emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={handleEmojiSelect}
                    width="100%"
                    height={300}
                    searchDisabled={false}
                    skinTonesDisabled={false}
                    lazyLoadEmojis={true}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label
                    htmlFor="emoji-size"
                    className="text-sm font-medium text-white"
                  >
                    Emoji Size: {brushSize}px
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs">10px</span>
                  <Slider
                    id="emoji-size"
                    min={10}
                    max={100}
                    step={5}
                    value={[brushSize]}
                    onValueChange={(v) => setBrushSize(v[0])}
                    className="flex-1"
                  />
                  <span className="text-white text-xs">100px</span>
                </div>
                <div className="mt-2 flex justify-center">
                  <div
                    style={{ fontSize: `${brushSize}px` }}
                    className="flex items-center justify-center"
                  >
                    {selectedEmoji}
                  </div>
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
              <div className="flex justify-between">
                <label
                  htmlFor="brush-size"
                  className="text-sm font-medium text-white"
                >
                  {tool === "brush"
                    ? "Brush"
                    : tool === "eraser"
                    ? "Eraser"
                    : "Arrow"}{" "}
                  Size: {brushSize}px
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">1px</span>
                <Slider
                  id="brush-size"
                  min={1}
                  max={50}
                  step={1}
                  value={[brushSize]}
                  onValueChange={(v) => setBrushSize(v[0])}
                  className="flex-1"
                />
                <span className="text-white text-xs">50px</span>
              </div>
              <div className="mt-2 flex justify-center">
                <div
                  className="rounded-full border border-white flex items-center justify-center"
                  style={{
                    width: `${Math.min(brushSize * 2, 60)}px`,
                    height: `${Math.min(brushSize * 2, 60)}px`,
                    backgroundColor:
                      tool === "eraser" ? "transparent" : brushColor,
                  }}
                >
                  {tool === "eraser" ? (
                    <Eraser className="h-4 w-4 text-white" />
                  ) : tool === "arrow" || tool === "doubleArrow" ? (
                    <MoveUpRight
                      className="h-4 w-4"
                      color={
                        getBrightness(brushColor) > 128 ? "#000000" : "#ffffff"
                      }
                    />
                  ) : (
                    <Paintbrush
                      className="h-4 w-4"
                      color={
                        getBrightness(brushColor) > 128 ? "#000000" : "#ffffff"
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Color Picker for Brush and Arrow */}
          {(tool === "brush" || tool === "arrow" || tool === "doubleArrow") && (
            <div className="space-y-2 mt-2">
              <label className="text-sm font-medium text-white">
                {tool === "brush" ? "Brush" : "Arrow"} Color
              </label>
              <div className="grid grid-cols-8 gap-1">
                {colorPalette.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md transition-transform ${
                      brushColor === color
                        ? "border-2 border-white scale-110 shadow-lg z-10"
                        : "border border-gray-700"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setBrushColor(color)}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center mt-2">
                <label className="text-sm font-medium text-white mr-2">
                  Custom:
                </label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-8 h-8 cursor-pointer bg-transparent"
                />
                <span className="ml-2 text-white text-xs font-mono">
                  {brushColor}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

PaintTool.displayName = "PaintTool";

export default PaintTool;
