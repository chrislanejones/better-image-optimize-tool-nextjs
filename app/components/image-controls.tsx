"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crop, Download, RefreshCw, Upload, Trash2, Droplets, X, Pencil, Paintbrush } from "lucide-react"

interface ImageControlsProps {
  isEditMode: boolean
  isCropping: boolean
  isBlurring: boolean
  isPainting: boolean
  format: string
  onFormatChange: (format: string) => void
  onToggleEditMode: () => void
  onToggleCropping: () => void
  onToggleBlurring: () => void
  onTogglePainting: () => void
  onApplyCrop: () => void
  onApplyBlur: () => void
  onApplyPaint: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onDownload: () => void
  onUploadNew: () => void
  onRemoveAll: () => void
  onCancelBlur?: () => void
  onCancelCrop?: () => void
  onCancelPaint?: () => void
}

export default function ImageControls({
  isEditMode,
  isCropping,
  isBlurring,
  isPainting,
  format,
  onFormatChange,
  onToggleEditMode,
  onToggleCropping,
  onToggleBlurring,
  onTogglePainting,
  onApplyCrop,
  onApplyBlur,
  onApplyPaint,
  onZoomIn,
  onZoomOut,
  onReset,
  onDownload,
  onUploadNew,
  onRemoveAll,
  onCancelBlur,
  onCancelCrop,
  onCancelPaint,
}: ImageControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-gray-700 p-2 rounded-lg z-10 relative">
      {isEditMode ? (
        // Edit Image Mode button bar
        <>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
              <Button onClick={onZoomOut} variant="outline">
                <span className="text-lg">-</span>
              </Button>
              <Button onClick={onZoomIn} variant="outline">
                <span className="text-lg">+</span>
              </Button>
            </div>

            <Button onClick={isCropping ? onApplyCrop : onToggleCropping} variant={isCropping ? "default" : "outline"}>
              <Crop className="mr-2 h-4 w-4" />
              {isCropping ? "Apply Crop" : "Crop Image"}
            </Button>

            <Button onClick={isBlurring ? onApplyBlur : onToggleBlurring} variant={isBlurring ? "default" : "outline"}>
              <Droplets className="mr-2 h-4 w-4" />
              {isBlurring ? "Apply Blur" : "Blur Tool"}
            </Button>

            <Button onClick={isPainting ? onApplyPaint : onTogglePainting} variant={isPainting ? "default" : "outline"}>
              <Paintbrush className="mr-2 h-4 w-4" />
              {isPainting ? "Apply Paint" : "Paint Tool"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isBlurring && onCancelBlur && (
              <Button onClick={onCancelBlur} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel Blur
              </Button>
            )}
            {isCropping && onCancelCrop && (
              <Button onClick={onCancelCrop} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel Crop
              </Button>
            )}
            {isPainting && onCancelPaint && (
              <Button onClick={onCancelPaint} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancel Paint
              </Button>
            )}
            <Button onClick={onToggleEditMode} variant="default">
              <X className="mr-2 h-4 w-4" />
              Exit Edit Mode
            </Button>
          </div>
        </>
      ) : (
        // Normal Mode button bar
        <>
          <div className="flex items-center gap-2">
            <Button onClick={onToggleEditMode} variant="default">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Image Mode
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={onReset} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>

            <Select value={format} onValueChange={onFormatChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onDownload} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            <Button onClick={onUploadNew} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Images
            </Button>

            <Button onClick={onRemoveAll} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove All Images
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
