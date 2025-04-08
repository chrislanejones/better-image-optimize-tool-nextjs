"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface Point {
  x: number
  y: number
  color: string
  size: number
}

interface PaintToolProps {
  imageUrl: string
  onApplyPaint: (paintedImageUrl: string) => void
  onCancel: () => void
}

const COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
]

export default function PaintTool({ imageUrl, onApplyPaint, onCancel }: PaintToolProps) {
  const [brushSize, setBrushSize] = useState<number>(10)
  const [selectedColor, setSelectedColor] = useState<string>("#FF0000") // Default to red
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [paintPoints, setPaintPoints] = useState<Point[]>([])
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Safe image URL
  const safeImageUrl = typeof imageUrl === "string" ? imageUrl : "/placeholder.svg"

  // Initialize canvas when component mounts
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = safeImageUrl

    img.onload = () => {
      setImageLoaded(true)
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions to match the image
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // Draw the original image on the canvas
      ctx.drawImage(img, 0, 0)
    }
  }, [safeImageUrl])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageLoaded) return
    setIsDrawing(true)

    // Add the first point where the user clicked
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect && canvasRef.current) {
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      const imageX = x * canvasRef.current.width
      const imageY = y * canvasRef.current.height

      const newPoint = { x: imageX, y: imageY, color: selectedColor, size: brushSize }
      setPaintPoints((prev) => [...prev, newPoint])
      drawPoint(newPoint)
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleMouseLeave = () => {
    setIsDrawing(false)
  }

  const drawPoint = (point: Point) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2)
    ctx.fillStyle = point.color
    ctx.fill()
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !canvasRef.current || !imageLoaded) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Calculate actual position on the image
    const imageX = x * canvas.width
    const imageY = y * canvas.height

    // Handle paint drawing
    if (isDrawing) {
      // Add point to paint points
      const newPoint = { x: imageX, y: imageY, color: selectedColor, size: brushSize }
      setPaintPoints((prev) => [...prev, newPoint])
      drawPoint(newPoint)
    } else {
      // Draw brush preview
      // First redraw the canvas with existing points to clear previous preview
      redrawCanvas()

      // Draw brush preview
      ctx.beginPath()
      ctx.arc(imageX, imageY, brushSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(imageX, imageY, brushSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = "black"
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  const redrawCanvas = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the original image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = safeImageUrl
    ctx.drawImage(img, 0, 0)

    // Draw all paint points
    paintPoints.forEach(drawPoint)
  }

  const applyPaint = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        onApplyPaint(url)
      }
    })
  }

  const increaseBrushSize = () => {
    setBrushSize((prev) => Math.min(prev + 5, 100))
  }

  const decreaseBrushSize = () => {
    setBrushSize((prev) => Math.max(prev - 5, 1))
  }

  // Expose the applyPaint method to parent component
  useEffect(() => {
    // This creates a reference to the applyPaint function that the parent can call
    if (typeof onApplyPaint === "function") {
      const originalOnApplyPaint = onApplyPaint
      onApplyPaint = (url: string) => {
        if (!url && canvasRef.current) {
          applyPaint()
        } else {
          originalOnApplyPaint(url)
        }
      }
    }
  }, [onApplyPaint])

  return (
    <div className="space-y-4">
      {/* Paint Tool Controls Bar */}
      <div className="flex items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
        <div className="grid grid-cols-2 gap-6 w-full">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="brush-size" className="text-sm font-medium text-white">
                Brush Size: {brushSize}px
              </label>
              <div className="flex items-center gap-1">
                <Button onClick={decreaseBrushSize} variant="outline" size="sm" className="h-6 w-6 p-0">
                  <span className="text-sm">-</span>
                </Button>
                <Button onClick={increaseBrushSize} variant="outline" size="sm" className="h-6 w-6 p-0">
                  <span className="text-sm">+</span>
                </Button>
              </div>
            </div>
            <Slider
              id="brush-size"
              min={1}
              max={100}
              step={1}
              value={[brushSize]}
              className="[&>.slider-track]:bg-gray-500"
              onValueChange={(value) => setBrushSize(value[0])}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-white block mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${selectedColor === color ? "ring-2 ring-white" : ""}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-auto"
        style={{ maxHeight: "75vh", height: "75vh" }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="max-w-full" style={{ cursor: "crosshair" }} />
        <img
          ref={imgRef}
          src={safeImageUrl || "/placeholder.svg"}
          alt="Image for painting"
          className="hidden" // Hidden but used as reference
        />
      </div>
    </div>
  )
}
