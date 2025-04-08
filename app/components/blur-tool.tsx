"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface Point {
  x: number
  y: number
}

interface BlurToolProps {
  imageUrl: string
  onApplyBlur: (blurredImageUrl: string) => void
  onCancel: () => void
}

export default function BlurTool({ imageUrl, onApplyBlur, onCancel }: BlurToolProps) {
  const [blurAmount, setBlurAmount] = useState<number>(10)
  const [brushSize, setBrushSize] = useState<number>(30)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [blurPoints, setBlurPoints] = useState<Point[]>([])
  const [imageLoaded, setImageLoaded] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize canvas when component mounts
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    img.onload = () => {
      setImageLoaded(true)
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions to match the image
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      // Create a temporary canvas for the blur effect
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      // Draw the original image on the temporary canvas
      tempCtx.drawImage(img, 0, 0)
      tempCanvasRef.current = tempCanvas

      // Draw the original image on the visible canvas
      ctx.drawImage(img, 0, 0)
    }
  }, [imageUrl])

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

      setBlurPoints((prev) => [...prev, { x: imageX, y: imageY }])
      applyBlurToCanvas([...blurPoints, { x: imageX, y: imageY }])
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleMouseLeave = () => {
    setIsDrawing(false)
  }

  const applyBlurToCanvas = (points: Point[]) => {
    if (!canvasRef.current || !tempCanvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the original image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    ctx.drawImage(img, 0, 0)

    // Create a temporary canvas with blur filter
    const blurredCanvas = document.createElement("canvas")
    blurredCanvas.width = canvas.width
    blurredCanvas.height = canvas.height
    const blurredCtx = blurredCanvas.getContext("2d")
    if (!blurredCtx) return

    // Draw the original image on the blurred canvas
    blurredCtx.drawImage(tempCanvasRef.current, 0, 0)

    // Apply blur filter
    blurredCtx.filter = `blur(${blurAmount}px)`

    // For each blur point, draw a circle from the blurred canvas onto the main canvas
    points.forEach((point) => {
      ctx.save()
      ctx.beginPath()
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(blurredCanvas, 0, 0)
      ctx.restore()
    })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !canvasRef.current || !imageLoaded) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx || !tempCanvasRef.current) return

    // Calculate actual position on the image
    const imageX = x * canvas.width
    const imageY = y * canvas.height

    // Handle blur drawing
    if (isDrawing) {
      // Add point to blur points
      const newPoints = [...blurPoints, { x: imageX, y: imageY }]
      setBlurPoints(newPoints)

      // Apply blur to all points
      applyBlurToCanvas(newPoints)
    } else {
      // Draw brush preview
      // Redraw the canvas with existing blur points
      applyBlurToCanvas(blurPoints)

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

  const applyBlur = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        onApplyBlur(url)
      }
    })
  }

  const increaseBrushSize = () => {
    setBrushSize((prev) => Math.min(prev + 5, 100))
  }

  const decreaseBrushSize = () => {
    setBrushSize((prev) => Math.max(prev - 5, 5))
  }

  const increaseBlurAmount = () => {
    setBlurAmount((prev) => Math.min(prev + 1, 20))
  }

  const decreaseBlurAmount = () => {
    setBlurAmount((prev) => Math.max(prev - 1, 1))
  }

  // Expose the applyBlur method to parent component
  useEffect(() => {
    // This creates a reference to the applyBlur function that the parent can call
    if (typeof onApplyBlur === "function") {
      const originalOnApplyBlur = onApplyBlur
      onApplyBlur = (url: string) => {
        if (!url && canvasRef.current) {
          applyBlur()
        } else {
          originalOnApplyBlur(url)
        }
      }
    }
  }, [onApplyBlur])

  return (
    <div className="space-y-4">
      {/* Blur Tool Controls Bar */}
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
              min={5}
              max={100}
              step={1}
              value={[brushSize]}
              className="[&>.slider-track]:bg-gray-500"
              onValueChange={(value) => setBrushSize(value[0])}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label htmlFor="blur-amount" className="text-sm font-medium text-white">
                Blur Amount: {blurAmount}px
              </label>
              <div className="flex items-center gap-1">
                <Button onClick={decreaseBlurAmount} variant="outline" size="sm" className="h-6 w-6 p-0">
                  <span className="text-sm">-</span>
                </Button>
                <Button onClick={increaseBlurAmount} variant="outline" size="sm" className="h-6 w-6 p-0">
                  <span className="text-sm">+</span>
                </Button>
              </div>
            </div>
            <Slider
              id="blur-amount"
              min={1}
              max={20}
              step={1}
              value={[blurAmount]}
              className="[&>.slider-track]:bg-gray-500"
              onValueChange={(value) => setBlurAmount(value[0])}
            />
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
          src={imageUrl || "/placeholder.svg"}
          alt="Image for blurring"
          className="hidden" // Hidden but used as reference
        />
      </div>
    </div>
  )
}
