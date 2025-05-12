"use client";

import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Move,
  Type,
  RotateCw,
} from "lucide-react";

export interface TextToolRef {
  getCanvasDataUrl: () => string | null;
}

interface TextToolProps {
  imageUrl: string;
  onApplyText: (textImageUrl: string) => void;
  onCancel: () => void;
}

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  italic: boolean;
  bold: boolean;
  align: "left" | "center" | "right";
  rotation: number;
  isSelected: boolean;
  isDragging: boolean;
}

const TextTool = forwardRef<TextToolRef, TextToolProps>(
  ({ imageUrl, onApplyText, onCancel }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [selectedElement, setSelectedElement] = useState<TextElement | null>(
      null
    );

    // Text editing states
    const [currentText, setCurrentText] = useState("");
    const [fontSize, setFontSize] = useState(24);
    const [fontFamily, setFontFamily] = useState("Arial");
    const [textColor, setTextColor] = useState("#ffffff");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
      "center"
    );
    const [rotation, setRotation] = useState(0);

    // Initialize canvas with image
    useEffect(() => {
      if (!imageUrl) {
        setError("No image URL provided");
        return;
      }

      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        setError("Canvas context not available");
        return;
      }

      contextRef.current = context;

      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        // Draw the image onto the canvas
        context.drawImage(image, 0, 0);
        setIsImageLoaded(true);
        setError(null);
      };

      image.onerror = () => {
        setError("Failed to load image");
      };

      image.src = imageUrl;
    }, [imageUrl]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getCanvasDataUrl: () => {
        if (!canvasRef.current) return null;
        try {
          const canvas = canvasRef.current;
          // Redraw everything to ensure the final state is captured
          redrawCanvas();
          return canvas.toDataURL("image/jpeg", 0.9);
        } catch (err) {
          setError("Failed to get canvas data");
          return null;
        }
      },
    }));

    // Function to redraw the canvas with all text elements
    const redrawCanvas = useCallback(() => {
      if (!canvasRef.current || !contextRef.current || !isImageLoaded) return;

      const canvas = canvasRef.current;
      const ctx = contextRef.current;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Redraw the background image
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageUrl;

      // We need to make sure the image is already loaded
      if (image.complete) {
        ctx.drawImage(image, 0, 0);
        drawAllTextElements();
      } else {
        image.onload = () => {
          ctx.drawImage(image, 0, 0);
          drawAllTextElements();
        };
      }
    }, [imageUrl, isImageLoaded, textElements]);

    // Draw all text elements on the canvas
    const drawAllTextElements = useCallback(() => {
      if (!contextRef.current) return;

      const ctx = contextRef.current;

      textElements.forEach((element) => {
        ctx.save();

        // Set font style
        let fontStyle = "";
        if (element.italic) fontStyle += "italic ";
        if (element.bold) fontStyle += "bold ";
        ctx.font = `${fontStyle}${element.fontSize}px ${element.fontFamily}`;
        ctx.fillStyle = element.color;
        ctx.textAlign = element.align;

        // Apply rotation if needed
        if (element.rotation !== 0) {
          // Calculate the center point of the text
          const textWidth = ctx.measureText(element.text).width;
          const textHeight = element.fontSize;
          let centerX = element.x;

          // Adjust center based on text alignment
          if (element.align === "center") {
            centerX = element.x;
          } else if (element.align === "left") {
            centerX = element.x + textWidth / 2;
          } else if (element.align === "right") {
            centerX = element.x - textWidth / 2;
          }

          const centerY = element.y;

          // Translate to the center of the text, rotate, then draw
          ctx.translate(centerX, centerY);
          ctx.rotate((element.rotation * Math.PI) / 180);

          // Draw the text at the origin (after translation)
          if (element.align === "center") {
            ctx.fillText(element.text, textWidth / 2, 0);
          }
        } else {
          // Draw without rotation
          ctx.fillText(element.text, element.x, element.y);
        }

        // Add selection indicator if element is selected
        if (element.isSelected) {
          ctx.strokeStyle = "#00bfff";
          ctx.lineWidth = 2;

          const textWidth = ctx.measureText(element.text).width;
          const textHeight = element.fontSize;

          // Draw selection box
          ctx.strokeRect(
            element.x -
              (element.align === "center"
                ? textWidth / 2
                : element.align === "right"
                ? textWidth
                : 0) -
              5,
            element.y - textHeight,
            textWidth + 10,
            textHeight + 10
          );

          // Draw handles for resizing/rotating
          ctx.fillStyle = "#00bfff";
          const handleSize = 6;

          // Top-left handle
          ctx.fillRect(
            element.x -
              (element.align === "center"
                ? textWidth / 2
                : element.align === "right"
                ? textWidth
                : 0) -
              5 -
              handleSize / 2,
            element.y - textHeight - 5 - handleSize / 2,
            handleSize,
            handleSize
          );

          // Top-right handle
          ctx.fillRect(
            element.x +
              (element.align === "center"
                ? textWidth / 2
                : element.align === "left"
                ? textWidth
                : 0) +
              5 -
              handleSize / 2,
            element.y - textHeight - 5 - handleSize / 2,
            handleSize,
            handleSize
          );

          // Bottom-left handle
          ctx.fillRect(
            element.x -
              (element.align === "center"
                ? textWidth / 2
                : element.align === "right"
                ? textWidth
                : 0) -
              5 -
              handleSize / 2,
            element.y + 5 - handleSize / 2,
            handleSize,
            handleSize
          );

          // Bottom-right handle
          ctx.fillRect(
            element.x +
              (element.align === "center"
                ? textWidth / 2
                : element.align === "left"
                ? textWidth
                : 0) +
              5 -
              handleSize / 2,
            element.y + 5 - handleSize / 2,
            handleSize,
            handleSize
          );
        }

        ctx.restore();
      });
    }, [textElements]);

    // Effect to redraw canvas when text elements change
    useEffect(() => {
      redrawCanvas();
    }, [redrawCanvas, textElements]);

    // Add a new text element to the canvas
    const addTextElement = useCallback(() => {
      if (!canvasRef.current || !currentText.trim()) return;

      const canvas = canvasRef.current;

      // Create a new text element
      const newElement: TextElement = {
        id: Date.now().toString(),
        text: currentText,
        x: canvas.width / 2,
        y: canvas.height / 2,
        fontSize,
        fontFamily,
        color: textColor,
        italic: isItalic,
        bold: isBold,
        align: textAlign,
        rotation,
        isSelected: true,
        isDragging: false,
      };

      // Deselect any currently selected elements
      const updatedElements = textElements.map((el) => ({
        ...el,
        isSelected: false,
      }));

      // Add new element and select it
      setTextElements([...updatedElements, newElement]);
      setSelectedElement(newElement);

      // Reset the input
      setCurrentText("");
    }, [
      currentText,
      fontSize,
      fontFamily,
      textColor,
      isItalic,
      isBold,
      textAlign,
      rotation,
      textElements,
    ]);

    // Update the selected element
    const updateSelectedElement = useCallback(() => {
      if (!selectedElement) return;

      const updatedElement = {
        ...selectedElement,
        text: currentText || selectedElement.text,
        fontSize,
        fontFamily,
        color: textColor,
        italic: isItalic,
        bold: isBold,
        align: textAlign,
        rotation,
      };

      setTextElements((prevElements) =>
        prevElements.map((el) =>
          el.id === selectedElement.id ? updatedElement : el
        )
      );

      setSelectedElement(updatedElement);
    }, [
      selectedElement,
      currentText,
      fontSize,
      fontFamily,
      textColor,
      isItalic,
      isBold,
      textAlign,
      rotation,
    ]);

    // Handle mouse events for dragging text
    const startDragging = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current || textElements.length === 0) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Check if click is on any text element
        let clickedElement: TextElement | null = null;

        // We need to iterate in reverse to select the topmost element first
        for (let i = textElements.length - 1; i >= 0; i--) {
          const element = textElements[i];
          const ctx = contextRef.current;

          if (!ctx) continue;

          // Set font to measure text width
          let fontStyle = "";
          if (element.italic) fontStyle += "italic ";
          if (element.bold) fontStyle += "bold ";
          ctx.font = `${fontStyle}${element.fontSize}px ${element.fontFamily}`;

          const textWidth = ctx.measureText(element.text).width;
          const textHeight = element.fontSize;

          // Calculate text bounds based on alignment
          let textLeft = element.x;
          if (element.align === "center") {
            textLeft = element.x - textWidth / 2;
          } else if (element.align === "right") {
            textLeft = element.x - textWidth;
          }

          const textTop = element.y - textHeight;

          // Check if click is within text bounds
          if (
            x >= textLeft - 5 &&
            x <= textLeft + textWidth + 5 &&
            y >= textTop - 5 &&
            y <= element.y + 5
          ) {
            clickedElement = element;
            break;
          }
        }

        if (clickedElement) {
          // Start dragging the clicked element
          setTextElements((prevElements) =>
            prevElements.map((el) => ({
              ...el,
              isSelected: el.id === clickedElement?.id,
              isDragging: el.id === clickedElement?.id,
            }))
          );

          setSelectedElement(clickedElement);
          setCurrentText(clickedElement.text);
          setFontSize(clickedElement.fontSize);
          setFontFamily(clickedElement.fontFamily);
          setTextColor(clickedElement.color);
          setIsItalic(clickedElement.italic);
          setIsBold(clickedElement.bold);
          setTextAlign(clickedElement.align);
          setRotation(clickedElement.rotation);
        } else {
          // Deselect all elements if clicked on empty space
          setTextElements((prevElements) =>
            prevElements.map((el) => ({
              ...el,
              isSelected: false,
              isDragging: false,
            }))
          );
          setSelectedElement(null);
        }
      },
      [textElements]
    );

    // Continue dragging
    const handleDragging = useCallback(
      (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const draggedElement = textElements.find((el) => el.isDragging);
        if (!draggedElement) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        // Update element position
        setTextElements((prevElements) =>
          prevElements.map((el) =>
            el.id === draggedElement.id ? { ...el, x, y } : el
          )
        );

        // Update selected element
        if (selectedElement && selectedElement.id === draggedElement.id) {
          setSelectedElement({ ...selectedElement, x, y });
        }
      },
      [textElements, selectedElement]
    );

    // Stop dragging
    const stopDragging = useCallback(() => {
      setTextElements((prevElements) =>
        prevElements.map((el) => ({
          ...el,
          isDragging: false,
        }))
      );
    }, []);

    // Delete selected element
    const deleteSelectedElement = useCallback(() => {
      if (!selectedElement) return;

      setTextElements((prevElements) =>
        prevElements.filter((el) => el.id !== selectedElement.id)
      );

      setSelectedElement(null);
    }, [selectedElement]);

    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Delete selected element with Delete key
        if (e.key === "Delete" || e.key === "Backspace") {
          if (selectedElement) {
            e.preventDefault();
            deleteSelectedElement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedElement, deleteSelectedElement]);

    return (
      <div className="flex flex-col w-full h-full">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col w-full md:w-1/2 space-y-2">
            <Input
              type="text"
              placeholder="Enter text..."
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />

            <div className="flex gap-2">
              <Button
                variant={isBold ? "default" : "outline"}
                size="sm"
                onClick={() => setIsBold(!isBold)}
                className="w-10 h-10 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant={isItalic ? "default" : "outline"}
                size="sm"
                onClick={() => setIsItalic(!isItalic)}
                className="w-10 h-10 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant={textAlign === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("left")}
                className="w-10 h-10 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={textAlign === "center" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("center")}
                className="w-10 h-10 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant={textAlign === "right" ? "default" : "outline"}
                size="sm"
                onClick={() => setTextAlign("right")}
                className="w-10 h-10 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-10 w-10 rounded cursor-pointer border-0"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full md:w-1/2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">
                  Font Size: {fontSize}px
                </label>
                <Slider
                  min={10}
                  max={72}
                  step={1}
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">
                  Rotation: {rotation}°
                </label>
                <Slider
                  min={-180}
                  max={180}
                  step={1}
                  value={[rotation]}
                  onValueChange={(value) => setRotation(value[0])}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="bg-gray-700 border-gray-600">
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
                  <SelectItem value="Impact">Impact</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTextElement}
                  disabled={!currentText.trim()}
                  className="flex-1"
                >
                  <Type className="h-4 w-4 mr-1" />
                  Add Text
                </Button>

                {selectedElement && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={updateSelectedElement}
                    className="flex-1"
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Update
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex-grow border rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 text-white z-50">
              <p className="bg-red-600 px-4 py-2 rounded">{error}</p>
            </div>
          )}

          {!isImageLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="max-w-full h-auto cursor-move"
            onMouseDown={startDragging}
            onMouseMove={handleDragging}
            onMouseUp={stopDragging}
            onMouseLeave={stopDragging}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {selectedElement && (
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteSelectedElement}
            >
              Delete Text
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (canvasRef.current) {
                const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
                onApplyText(dataUrl);
              }
            }}
          >
            Apply Text
          </Button>
        </div>
      </div>
    );
  }
);

TextTool.displayName = "TextTool";

export default TextTool;
