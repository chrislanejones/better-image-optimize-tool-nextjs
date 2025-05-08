"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { type TextToolProps, type TextToolRef } from "@/types/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { X, Trash, Plus, Type } from "lucide-react";

// Define the Text object interface
interface TextObject {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  selected: boolean;
}

const TextTool = forwardRef<TextToolRef, TextToolProps>(
  (
    {
      imageUrl,
      onApplyText,
      onCancel,
      textSize = 24,
      textFont = "Arial",
      textColor = "#000000",
      zoom = 1,
    },
    ref
  ) => {
    const [texts, setTexts] = useState<TextObject[]>([]);
    const [activeText, setActiveText] = useState<TextObject | null>(null);
    const [inputText, setInputText] = useState("");
    const [fontSize, setFontSize] = useState(textSize);
    const [fontFamily, setFontFamily] = useState(textFont);
    const [color, setColor] = useState(textColor);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const textInputRef = useRef<HTMLInputElement>(null);

    // Expose method to get canvas data URL via ref
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
    }));

    // Load and setup the image
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;

      image.onload = () => {
        // Set canvas dimensions to match image
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        // Store the image for later use
        imgRef.current = image;

        // Draw the image onto the canvas
        drawCanvas();
      };
    }, [imageUrl]);

    // Draw everything on the canvas
    const drawCanvas = () => {
      if (!canvasRef.current || !imgRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the base image
      ctx.drawImage(imgRef.current, 0, 0);

      // Draw all text objects
      texts.forEach((textObj) => {
        ctx.font = `${textObj.fontSize}px ${textObj.fontFamily}`;
        ctx.fillStyle = textObj.color;
        ctx.fillText(textObj.text, textObj.x, textObj.y);

        // Draw selection indicator for selected text
        if (textObj.selected) {
          const metrics = ctx.measureText(textObj.text);
          const height = textObj.fontSize;

          ctx.strokeStyle = "#3b82f6"; // Blue color
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(
            textObj.x - 4,
            textObj.y - height,
            metrics.width + 8,
            height + 8
          );
          ctx.setLineDash([]);
        }
      });
    };

    // Update canvas when texts change
    useEffect(() => {
      drawCanvas();
    }, [texts]);

    // Add a new text object at the center of the canvas
    const addText = () => {
      if (!inputText.trim() || !canvasRef.current) return;

      const canvas = canvasRef.current;

      const newText: TextObject = {
        id: crypto.randomUUID(),
        text: inputText,
        x: canvas.width / 2,
        y: canvas.height / 2,
        fontSize,
        fontFamily,
        color,
        selected: true,
      };

      // Deselect any previously selected text
      const updatedTexts = texts.map((text) => ({
        ...text,
        selected: false,
      }));

      setTexts([...updatedTexts, newText]);
      setActiveText(newText);
      setInputText("");

      // Focus the input for next text
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    };

    // Delete the selected text
    const deleteSelectedText = () => {
      if (!activeText) return;

      setTexts(texts.filter((text) => text.id !== activeText.id));
      setActiveText(null);
    };

    // Update properties of the selected text
    useEffect(() => {
      if (!activeText) return;

      const updatedTexts = texts.map((text) =>
        text.id === activeText.id
          ? { ...text, fontSize, fontFamily, color }
          : text
      );

      setTexts(updatedTexts);
    }, [fontSize, fontFamily, color]);

    // Handle clicking on canvas to select text
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = ((e.clientX - rect.left) * scaleX) / zoom;
      const y = ((e.clientY - rect.top) * scaleY) / zoom;

      // Check if any text was clicked
      const clickedText = [...texts].reverse().find((text) => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return false;

        ctx.font = `${text.fontSize}px ${text.fontFamily}`;
        const metrics = ctx.measureText(text.text);
        const height = text.fontSize;

        return (
          x >= text.x - 4 &&
          x <= text.x + metrics.width + 4 &&
          y >= text.y - height &&
          y <= text.y + 8
        );
      });

      if (clickedText) {
        // Select the clicked text
        const updatedTexts = texts.map((text) => ({
          ...text,
          selected: text.id === clickedText.id,
        }));

        setTexts(updatedTexts);
        setActiveText(clickedText);
        setFontSize(clickedText.fontSize);
        setFontFamily(clickedText.fontFamily);
        setColor(clickedText.color);

        // Start tracking for potential drag
        setIsDragging(true);
        setDragStart({ x, y });
      } else {
        // Deselect all
        const updatedTexts = texts.map((text) => ({
          ...text,
          selected: false,
        }));

        setTexts(updatedTexts);
        setActiveText(null);
      }
    };

    // Handle mouse move for dragging text
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !activeText || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = ((e.clientX - rect.left) * scaleX) / zoom;
      const y = ((e.clientY - rect.top) * scaleY) / zoom;

      const dx = x - dragStart.x;
      const dy = y - dragStart.y;

      // Update the position of the active text
      const updatedTexts = texts.map((text) =>
        text.id === activeText.id
          ? { ...text, x: text.x + dx, y: text.y + dy }
          : text
      );

      setTexts(updatedTexts);
      setActiveText({
        ...activeText,
        x: activeText.x + dx,
        y: activeText.y + dy,
      });

      // Update drag start position
      setDragStart({ x, y });
    };

    // Stop dragging when mouse is released
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Apply changes and return the result
    const handleApply = () => {
      if (!canvasRef.current) return;

      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
      onApplyText(dataUrl);
    };

    return (
      <div className="flex flex-col gap-4 w-full h-full">
        <div className="flex items-center gap-2 mb-2">
          <Input
            ref={textInputRef}
            type="text"
            placeholder="Enter text..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addText} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Text
          </Button>
          {activeText && (
            <Button
              onClick={deleteSelectedText}
              size="sm"
              variant="destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>

        {activeText && (
          <div className="grid grid-cols-3 gap-2 bg-gray-800 p-2 rounded-md">
            <div className="space-y-1">
              <label
                htmlFor="font-size"
                className="text-xs font-medium text-white"
              >
                Size: {fontSize}px
              </label>
              <Slider
                id="font-size"
                min={8}
                max={72}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                className="[&>.slider-track]:bg-gray-500"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="font-family"
                className="text-xs font-medium text-white"
              >
                Font Family
              </label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Times New Roman">
                    Times New Roman
                  </SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="text-color"
                className="text-xs font-medium text-white"
              >
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-gray-600"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 h-8 rounded px-2 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        <div className="relative flex-1 border rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain rounded"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: activeText ? "move" : "default",
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleApply} variant="default">
            Apply Text
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    );
  }
);

TextTool.displayName = "TextTool";

export default TextTool;
