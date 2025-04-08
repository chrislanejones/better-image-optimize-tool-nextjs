"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crop, Download, RefreshCw, Upload, Trash2, Droplets } from "lucide-react"
import ReactCrop, { type Crop as CropType, type PixelCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ImageFile {
  id: string
  file: File
  url: string
}

interface ImageCropperProps {
  image: ImageFile
  onUploadNew: () => void
  onRemoveAll: () => void
}

interface ImageStats {
  width: number
  height: number
  size: number
  format: string
}

interface MousePosition {
  x: number
  y: number
}

interface Point {
  x: number
  y: number
}

export default function ImageCropper({ image, onUploadNew, onRemoveAll }: ImageCropperProps) {
  const [crop, setCrop] = useState<CropType>({
    unit: "%",
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [format, setFormat] = useState<string>("jpeg")
  const [isCropping, setIsCropping] = useState<boolean>(false)
  const [isBlurring, setIsBlurring] = useState<boolean>(false)
  const [blurAmount, setBlurAmount] = useState<number>(10)
  const [brushSize, setBrushSize] = useState<number>(30)
  const [previewUrl, setPreviewUrl] = useState<string>(image.url)
  const [zoom, setZoom] = useState<number>(1)
  const [keepAspectRatio, setKeepAspectRatio] = useState<boolean>(true)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [originalStats, setOriginalStats] = useState<ImageStats | null>(null)
  const [newStats, setNewStats] = useState<ImageStats | null>(null)
  const [dataSavings, setDataSavings] = useState<number>(0)
  const [hasEdited, setHasEdited] = useState<boolean>(false)
  const [mousePosition, setMousePosition] = useState<MousePosition | null>(null)
  const [isHovering, setIsHovering] = useState<boolean>(false)
  const [magnifierZoom, setMagnifierZoom] = useState<number>(3)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [blurPoints, setBlurPoints] = useState<Point[]>([])
  const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null)

  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blurCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reset state when image changes
    setPreviewUrl(image.url)
    setCrop({
      unit: "%",
      width: 100,
      height: 100,
      x: 0,
      y: 0,
    })
    setIsCropping(false)
    setIsBlurring(false)
    setZoom(1)
    setHasEdited(false)
    setNewStats(null)
    setBlurPoints([])

    // Get image dimensions
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setWidth(img.width)
      setHeight(img.height)
      setAspectRatio(img.width / img.height)
      setImageSize({ width: img.width, height: img.height })

      // Set original stats
      setOriginalStats({
        width: img.width,
        height: img.height,
        size: image.file.size,
        format: image.file.type.split("/")[1],
      })
    }
    img.src = image.url
  }, [image])

  // Initialize blur canvas when entering blur mode
  useEffect(() => {
    if (isBlurring && imgRef.current && blurCanvasRef.current) {
      const canvas = blurCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set canvas dimensions to match the image
      canvas.width = imgRef.current.naturalWidth
      canvas.height = imgRef.current.naturalHeight

      // Create a temporary canvas for the blur effect
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      // Draw the original image on the temporary canvas
      tempCtx.drawImage(imgRef.current, 0, 0)
      setTempCanvas(tempCanvas)

      // Draw the original image on the visible canvas
      ctx.drawImage(imgRef.current, 0, 0)
    }
  }, [isBlurring])

  const toggleCropping = () => {
    setIsCropping(!isCropping)
    if (isBlurring) setIsBlurring(false)
  }

  const toggleBlurring = () => {
    setIsBlurring(!isBlurring)
    if (isCropping) setIsCropping(false)
  }

  const handleResize = (applyOnly = false) => {
    if (!imgRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imgRef.current

    // Set canvas dimensions to desired resize values
    canvas.width = width
    canvas.height = height

    // Draw the image with new dimensions
    ctx.drawImage(img, 0, 0, width, height)

    // Only update the preview URL if we're applying the changes
    if (applyOnly) {
      // Convert to blob and create URL
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Revoke previous URL to prevent memory leaks
            if (previewUrl !== image.url) {
              URL.revokeObjectURL(previewUrl)
            }
            const url = URL.createObjectURL(blob)
            setPreviewUrl(url)
            setHasEdited(true)

            // Update new stats
            setNewStats({
              width: width,
              height: height,
              size: blob.size,
              format: format === "webp" ? "webp" : format === "jpeg" ? "jpeg" : image.file.type.split("/")[1],
            })

            // Calculate data savings
            if (originalStats) {
              const savings = 100 - (blob.size / originalStats.size) * 100
              setDataSavings(savings)
            }
          }
        },
        format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : image.file.type,
      )
    }
  }

  const handleCrop = () => {
    if (!imgRef.current || !canvasRef.current || !completedCrop) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    )

    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Revoke previous URL to prevent memory leaks
          if (previewUrl !== image.url) {
            URL.revokeObjectURL(previewUrl)
          }
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          setIsCropping(false)
          setHasEdited(true)

          // Update dimensions after crop
          setWidth(completedCrop.width)
          setHeight(completedCrop.height)

          // Update new stats
          setNewStats({
            width: completedCrop.width,
            height: completedCrop.height,
            size: blob.size,
            format: format === "webp" ? "webp" : format === "jpeg" ? "jpeg" : image.file.type.split("/")[1],
          })

          // Calculate data savings
          if (originalStats) {
            const savings = 100 - (blob.size / originalStats.size) * 100
            setDataSavings(savings)
          }
        }
      },
      format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : image.file.type,
    )
  }

  const applyBlur = () => {
    if (!blurCanvasRef.current || !canvasRef.current || !imgRef.current) return

    const canvas = canvasRef.current
    const blurCanvas = blurCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match the image
    canvas.width = imgRef.current.naturalWidth
    canvas.height = imgRef.current.naturalHeight

    // Draw the blur canvas onto the main canvas
    ctx.drawImage(blurCanvas, 0, 0)

    // Convert to blob and create URL
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Revoke previous URL to prevent memory leaks
          if (previewUrl !== image.url) {
            URL.revokeObjectURL(previewUrl)
          }
          const url = URL.createObjectURL(blob)
          setPreviewUrl(url)
          setIsBlurring(false)
          setHasEdited(true)
          setBlurPoints([])

          // Update new stats
          setNewStats({
            width: canvas.width,
            height: canvas.height,
            size: blob.size,
            format: format === "webp" ? "webp" : format === "jpeg" ? "jpeg" : image.file.type.split("/")[1],
          })

          // Calculate data savings
          if (originalStats) {
            const savings = 100 - (blob.size / originalStats.size) * 100
            setDataSavings(savings)
          }
        }
      },
      format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : image.file.type,
    )
  }

  const downloadImage = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // If we haven't done any edits yet, draw the current image to canvas
    if (previewUrl === image.url) {
      const ctx = canvas.getContext("2d")
      if (!ctx || !imgRef.current) return

      canvas.width = imgRef.current.naturalWidth
      canvas.height = imgRef.current.naturalHeight

      ctx.drawImage(imgRef.current, 0, 0)
    }

    // Convert to the selected format
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `image-${format === "webp" ? "webp" : format === "jpeg" ? "jpg" : image.file.type.split("/")[1]}`
          a.click()
          URL.revokeObjectURL(url)
        }
      },
      format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : image.file.type,
    )
  }

  const resetImage = () => {
    // Revoke previous URL to prevent memory leaks
    if (previewUrl !== image.url) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(image.url)
    setIsCropping(false)
    setIsBlurring(false)
    setHasEdited(false)
    setNewStats(null)
    setBlurPoints([])

    // Reset dimensions to original
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setWidth(img.width)
      setHeight(img.height)
    }
    img.src = image.url
  }

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3))
  }

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  // Calculate estimated page speed score improvement
  const getPageSpeedImprovement = () => {
    if (!dataSavings || dataSavings <= 0) return "No change"
    if (dataSavings < 20) return "Minor improvement"
    if (dataSavings < 50) return "Moderate improvement"
    return "Significant improvement"
  }

  // Handle mouse movement for the magnifier and blur tool
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return

    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    setMousePosition({ x, y })

    // Handle blur drawing
    if (isBlurring && isDrawing && blurCanvasRef.current && imgRef.current) {
      const canvas = blurCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx || !tempCanvas) return

      // Calculate actual position on the image
      const imageX = x * imgRef.current.naturalWidth
      const imageY = y * imgRef.current.naturalHeight

      // Add point to blur points
      setBlurPoints((prev) => [...prev, { x: imageX, y: imageY }])

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the original image
      ctx.drawImage(imgRef.current, 0, 0)

      // Apply blur to each point
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      // Create a temporary canvas with blur filter
      const blurredCanvas = document.createElement("canvas")
      blurredCanvas.width = canvas.width
      blurredCanvas.height = canvas.height
      const blurredCtx = blurredCanvas.getContext("2d")
      if (!blurredCtx) return

      // Draw the original image on the blurred canvas
      blurredCtx.drawImage(tempCanvas, 0, 0)

      // Apply blur filter
      blurredCtx.filter = `blur(${blurAmount}px)`

      // For each blur point, draw a circle from the blurred canvas onto the main canvas
      blurPoints.forEach((point) => {
        ctx.save()
        ctx.beginPath()
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(blurredCanvas, 0, 0)
        ctx.restore()
      })
    }

    // Draw brush preview
    if (isBlurring && !isDrawing && blurCanvasRef.current && imgRef.current) {
      const canvas = blurCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Calculate actual position on the image
      const imageX = x * imgRef.current.naturalWidth
      const imageY = y * imgRef.current.naturalHeight

      // Redraw the canvas with existing blur points
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(imgRef.current, 0, 0)

      // Apply existing blur points
      if (tempCanvas) {
        const blurredCanvas = document.createElement("canvas")
        blurredCanvas.width = canvas.width
        blurredCanvas.height = canvas.height
        const blurredCtx = blurredCanvas.getContext("2d")
        if (!blurredCtx) return

        blurredCtx.drawImage(tempCanvas, 0, 0)
        blurredCtx.filter = `blur(${blurAmount}px)`

        blurPoints.forEach((point) => {
          ctx.save()
          ctx.beginPath()
          ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(blurredCanvas, 0, 0)
          ctx.restore()
        })
      }

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

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isBlurring) {
      setIsDrawing(true)
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isBlurring) {
      setIsDrawing(false)
    }
  }

  const handleMouseEnter = () => {
    if (!isCropping && !isBlurring) {
      setIsHovering(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    setIsDrawing(false)
  }

  // Increase magnifier zoom
  const increaseMagnifierZoom = () => {
    setMagnifierZoom((prev) => Math.min(prev + 0.5, 6))
  }

  // Decrease magnifier zoom
  const decreaseMagnifierZoom = () => {
    setMagnifierZoom((prev) => Math.max(prev - 0.5, 1.5))
  }

  // Get background position for the magnifier
  const getBackgroundPosition = () => {
    if (isHovering && mousePosition) {
      // When hovering, use mouse position
      return `${mousePosition.x * 100}% ${mousePosition.y * 100}%`
    } else {
      // Default to center when not hovering
      return "50% 50%"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 mb-4 bg-gray-700 p-2 rounded-lg">
        <Button onClick={isCropping ? handleCrop : toggleCropping} variant={isCropping ? "default" : "outline"}>
          <Crop className="mr-2 h-4 w-4" />
          {isCropping ? "Apply Crop" : "Crop Image"}
        </Button>

        <Button onClick={isBlurring ? applyBlur : toggleBlurring} variant={isBlurring ? "default" : "outline"}>
          <Droplets className="mr-2 h-4 w-4" />
          {isBlurring ? "Apply Blur" : "Blur Tool"}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Format:</span>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={downloadImage} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>

        <Button onClick={resetImage} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>

        <div className="flex items-center gap-1">
          <Button onClick={zoomOut} variant="outline">
            <span className="text-lg">-</span>
          </Button>
          <Button onClick={zoomIn} variant="outline">
            <span className="text-lg">+</span>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button onClick={onUploadNew} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload New Images
          </Button>

          <Button onClick={onRemoveAll} variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove All Images
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <section className="md:col-span-3">
            <div className="space-y-2">
              <div
                className="relative border rounded-lg overflow-hidden"
                ref={imageContainerRef}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {isCropping ? (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={undefined}
                  >
                    <img
                      ref={imgRef}
                      src={image.url || "/placeholder.svg"}
                      alt="Original image for cropping"
                      className="max-w-full"
                    />
                  </ReactCrop>
                ) : isBlurring ? (
                  <div className="overflow-auto" style={{ maxHeight: "700px", height: "70vh" }}>
                    <div className="relative">
                      <canvas ref={blurCanvasRef} className="max-w-full" style={{ cursor: "crosshair" }} />
                      <img
                        ref={imgRef}
                        src={previewUrl || "/placeholder.svg"}
                        alt="Image for blurring"
                        className="hidden" // Hidden but used as reference
                      />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto" style={{ maxHeight: "700px", height: "70vh" }}>
                    <img
                      ref={imgRef}
                      src={previewUrl || "/placeholder.svg"}
                      alt="Edited image"
                      className="max-w-full transform origin-top-left"
                      style={{ transform: `scale(${zoom})` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="md:col-span-1 space-y-6">
            {isBlurring && (
              <Card className="bg-gray-800 text-white border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Blur Brush</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="brush-size" className="text-sm font-medium">
                        Brush Size: {brushSize}px
                      </label>
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

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="blur-amount" className="text-sm font-medium">
                        Blur Amount: {blurAmount}px
                      </label>
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

                  <div className="text-xs text-gray-400 mt-2">Click and drag on the image to apply blur</div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Resize</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="width" className="text-sm font-medium">
                      Width: {width}px
                    </label>
                  </div>
                  <Slider
                    id="width"
                    min={10}
                    max={imgRef.current?.naturalWidth || 1000}
                    step={1}
                    value={[width]}
                    className="[&>.slider-track]:bg-gray-500"
                    onValueChange={(value) => {
                      const newWidth = value[0]
                      setWidth(newWidth)

                      if (keepAspectRatio) {
                        const newHeight = Math.round(newWidth / aspectRatio)
                        setHeight(newHeight)
                      }

                      handleResize()
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="height" className="text-sm font-medium">
                      Height: {height}px
                    </label>
                  </div>
                  <Slider
                    id="height"
                    min={10}
                    max={imgRef.current?.naturalHeight || 1000}
                    step={1}
                    value={[height]}
                    className="[&>.slider-track]:bg-gray-500"
                    onValueChange={(value) => {
                      const newHeight = value[0]
                      setHeight(newHeight)

                      if (keepAspectRatio) {
                        const newWidth = Math.round(newHeight * aspectRatio)
                        setWidth(newWidth)
                      }

                      handleResize()
                    }}
                  />
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    id="keep-aspect-ratio"
                    checked={keepAspectRatio}
                    onChange={(e) => setKeepAspectRatio(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="keep-aspect-ratio" className="text-sm font-medium">
                    Keep aspect ratio
                  </label>
                </div>

                <Button onClick={() => handleResize(true)} className="w-full">
                  Apply Resize
                </Button>
              </CardContent>
            </Card>

            {hasEdited && dataSavings > 0 && (
              <Card className="bg-gray-800 text-white border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Performance Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">Data savings:</p>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                      <div
                        className="bg-green-500 h-4 rounded-full"
                        style={{ width: `${Math.min(dataSavings, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-right">{dataSavings.toFixed(1)}%</p>

                    <p className="text-sm mt-4">Estimated page speed impact:</p>
                    <p className="text-sm font-medium text-green-400">{getPageSpeedImprovement()}</p>
                    <p className="text-xs mt-2 text-gray-400">
                      {dataSavings > 50
                        ? "This optimization could significantly improve your Core Web Vitals scores."
                        : "Further optimizations may be needed for maximum performance."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasEdited && !isBlurring && !isCropping && (
              <Card className="bg-gray-800 text-white border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-base">Zoom View</span>
                    <div className="flex items-center gap-1">
                      <Button onClick={decreaseMagnifierZoom} variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="text-sm">-</span>
                      </Button>
                      <span className="text-xs">{magnifierZoom.toFixed(1)}x</span>
                      <Button onClick={increaseMagnifierZoom} variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <span className="text-sm">+</span>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `url(${previewUrl})`,
                        backgroundPosition: getBackgroundPosition(),
                        backgroundSize: `${magnifierZoom * 100}%`,
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          {/* Crosshair */}
                          <div className="absolute w-[1px] h-16 bg-red-500 left-1/2 -translate-x-1/2"></div>
                          <div className="absolute h-[1px] w-16 bg-red-500 top-1/2 -translate-y-1/2"></div>
                          <div className="w-16 h-16 rounded-sm border border-red-500 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          </div>
                        </div>
                      </div>
                      {!isHovering && (
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <p className="text-xs text-white bg-black bg-opacity-50 py-1 px-2 rounded-md inline-block">
                            Mouse over image to navigate
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        {/* Image Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {originalStats && (
            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Original Image</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">File name: {image.file.name}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Dimensions</p>
                    <p className="text-sm">
                      {originalStats.width} × {originalStats.height}px
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File type</p>
                    <p className="text-sm">{image.file.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File size</p>
                    <p className="text-sm">{(originalStats.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasEdited && newStats && (
            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Edited Image</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  File name: {image.file.name.split(".")[0]}_edited.
                  {format === "webp" ? "webp" : format === "jpeg" ? "jpg" : image.file.type.split("/")[1]}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Dimensions</p>
                    <p className="text-sm">
                      {newStats.width} × {newStats.height}px
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File type</p>
                    <p className="text-sm">
                      {format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : image.file.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">File size</p>
                    <p className="text-sm">{(newStats.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

