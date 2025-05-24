"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Type, Plus, Minus } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { TextToolRef } from "@/types/types";
import { TextToolProps } from "@/types/types";

// Main TextTool component with proper forwardRef
const TextTool = forwardRef<TextToolRef, TextToolProps>(
  (
    { imageUrl, onApplyText, onCancel, setEditorState, setBold, setItalic },
    ref
  ) => {
    // State for text properties
    const [text, setText] = useState<string>("");
    const [font, setFont] = useState<string>("Arial");
    const [size, setSize] = useState<number>(24);
    const [color, setColor] = useState<string>("#ffffff");
    const [position, setPosition] = useState<{ x: number; y: number }>({
      x: 50,
      y: 50,
    });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isBold, setIsBold] = useState<boolean>(false);
    const [isItalic, setIsItalic] = useState<boolean>(false);
    const [alignment, setAlignment] = useState<"left" | "center" | "right">(
      "center"
    );

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Initialize canvas with image
    useEffect(() => {
      if (!canvasRef.current || !imageUrl) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      };
      img.src = imageUrl;
    }, [imageUrl]);

    // Handle text input changes
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setText(e.target.value);
    };

    // Handle font selection
    const handleFontChange = (value: string) => {
      setFont(value);
    };

    // Handle size changes
    const handleSizeChange = (value: number[]) => {
      setSize(value[0]);
    };

    // Handle color changes
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setColor(e.target.value);
    };

    // Handle canvas click to position text
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!imageContainerRef.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };

    // Handle moving text with mouse
    const handleMouseDown = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("text-preview")) {
        setIsDragging(true);
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !imageContainerRef.current) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setPosition({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Toggle bold style
    const toggleBold = () => {
      setIsBold(!isBold);
      setBold(!isBold);
    };

    // Toggle italic style
    const toggleItalic = () => {
      setIsItalic(!isItalic);
      setItalic(!isItalic);
    };

    // Apply text to image
    const applyText = useCallback(() => {
      if (!canvasRef.current || !text) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // First redraw the original image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Clear and redraw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Save the current state
        ctx.save();

        // Set font properties
        const fontStyle = `${isItalic ? "italic " : ""}${
          isBold ? "bold " : ""
        }${size}px ${font}`;
        ctx.font = fontStyle;
        ctx.fillStyle = color;
        ctx.textAlign = alignment;

        // Calculate position
        const x = (position.x / 100) * canvas.width;
        const y = (position.y / 100) * canvas.height;

        // Add text to canvas
        ctx.fillText(text, x, y);

        // Restore canvas state
        ctx.restore();

        // Generate image URL and pass to parent
        const textedImageUrl = canvas.toDataURL();
        onApplyText(textedImageUrl);

        // Handle editor state - using string directly for compatibility
        setEditorState("editImage");
      };
      img.src = imageUrl;
    }, [
      text,
      font,
      size,
      color,
      position,
      isBold,
      isItalic,
      alignment,
      imageUrl,
      onApplyText,
      setEditorState,
    ]);

    // Get canvas data URL
    const getCanvasDataUrl = useCallback(() => {
      if (!canvasRef.current) return null;
      return canvasRef.current.toDataURL();
    }, []);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      applyText,
      getCanvasDataUrl,
    }));

    return (
      <div className="grid grid-cols-2 gap-2">
        {/* Canvas Column */}
        <div className="col-1 bg-gray-800 rounded-lg p-4">
          <div
            ref={imageContainerRef}
            className="relative border rounded-lg overflow-hidden cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} className="hidden" />
            <img
              src={imageUrl}
              alt="Original image for text overlay"
              className="w-full h-auto"
            />

            {/* Text position indicator - crosshair style */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Horizontal line */}
              <div
                className="absolute w-8 h-0.5 bg-red-500 opacity-75"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              {/* Vertical line */}
              <div
                className="absolute w-0.5 h-8 bg-red-500 opacity-75"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
              {/* Center dot */}
              <div
                className="absolute w-2 h-2 bg-red-500 rounded-full"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>

            {/* Text preview */}
            {text && (
              <div
                className={`text-preview absolute p-2 cursor-move ${
                  isDragging ? "opacity-70" : ""
                }`}
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: "translate(-50%, -50%)",
                  fontFamily: font,
                  fontSize: `${size}px`,
                  fontWeight: isBold ? "bold" : "normal",
                  fontStyle: isItalic ? "italic" : "normal",
                  color: color,
                  textAlign: alignment,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                  pointerEvents: "auto",
                }}
              >
                {text}
              </div>
            )}
          </div>
        </div>

        {/* Controls Column */}
        <div className="col-1 flex flex-col gap-4 bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white">Text Tools</h3>

          <div className="space-y-4">
            {/* Text input and style buttons */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter text..."
                value={text}
                onChange={handleTextChange}
                className="flex-1"
              />

              <Button
                onClick={toggleBold}
                variant={isBold ? "default" : "outline"}
                className="h-10 w-10 p-0 font-bold"
              >
                B
              </Button>

              <Button
                onClick={toggleItalic}
                variant={isItalic ? "default" : "outline"}
                className="h-10 w-10 p-0 italic"
              >
                I
              </Button>
            </div>

            {/* Alignment */}
            <div>
              <label className="text-sm font-medium block mb-2 text-white">
                Text Alignment
              </label>
              <Select
                value={alignment}
                onValueChange={(value: any) => setAlignment(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Align" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Family */}
            <div>
              <label className="text-sm font-medium block mb-2 text-white">
                Font Family
              </label>
              <Select value={font} onValueChange={handleFontChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">
                    Times New Roman
                  </SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                  <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-sm font-medium block mb-2 text-white">
                Font Size: {size}px
              </label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSize(Math.max(8, size - 2))}
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Slider
                  value={[size]}
                  min={8}
                  max={72}
                  step={1}
                  onValueChange={handleSizeChange}
                  className="flex-1"
                />
                <Button
                  onClick={() => setSize(Math.min(72, size + 2))}
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Text Color */}
            <div>
              <label className="text-sm font-medium block mb-2 text-white">
                Text Color
              </label>
              <div className="flex gap-2 items-center">
                <div
                  className="w-12 h-12 rounded-md border border-gray-600"
                  style={{ backgroundColor: color }}
                />
                <input
                  type="color"
                  value={color}
                  onChange={handleColorChange}
                  className="h-12 w-20 cursor-pointer"
                />
                <span className="text-white text-sm font-mono">{color}</span>
              </div>
            </div>

            {/* Position indicator */}
            <div className="bg-gray-700 p-3 rounded-md">
              <p className="text-sm text-gray-300 mb-2">
                Click on the image to position text
              </p>
              <p className="text-xs text-gray-400">
                Position: X: {Math.round(position.x)}%, Y:{" "}
                {Math.round(position.y)}%
              </p>
            </div>

            {/* Text preview */}
            {text && (
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-300 mb-2">Preview:</p>
                <div
                  className="text-center p-2"
                  style={{
                    fontFamily: font,
                    fontSize: `${Math.min(size, 32)}px`,
                    fontWeight: isBold ? "bold" : "normal",
                    fontStyle: isItalic ? "italic" : "normal",
                    color: color,
                  }}
                >
                  {text}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TextTool.displayName = "TextTool";

export default TextTool;
