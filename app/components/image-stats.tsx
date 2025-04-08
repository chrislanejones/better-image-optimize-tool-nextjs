"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ImageStats {
  width: number
  height: number
  size: number
  format: string
}

interface ImageStatsProps {
  originalStats: ImageStats | null
  newStats: ImageStats | null
  dataSavings: number
  hasEdited: boolean
  fileName: string
  format: string
  fileType: string
}

export default function ImageStatsDisplay({
  originalStats,
  newStats,
  dataSavings,
  hasEdited,
  fileName,
  format,
  fileType,
}: ImageStatsProps) {
  // Calculate estimated page speed score improvement
  const getPageSpeedImprovement = () => {
    if (!dataSavings || dataSavings <= 0) return "No change"
    if (dataSavings < 20) return "Minor improvement"
    if (dataSavings < 50) return "Moderate improvement"
    return "Significant improvement"
  }

  // Safe file name handling
  const safeFileName = fileName || "image.png"
  const safeFileType = fileType || "image/png"

  // Safe format extraction
  const getFileExtension = () => {
    if (format === "webp") return "webp"
    if (format === "jpeg") return "jpg"
    if (safeFileType && typeof safeFileType === "string" && safeFileType.includes("/")) {
      return safeFileType.split("/")[1]
    }
    return "png"
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {originalStats && (
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Original Image</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">File name: {safeFileName}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">Dimensions</p>
                <p className="text-sm">
                  {originalStats.width} × {originalStats.height}px
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">File type</p>
                <p className="text-sm">{safeFileType}</p>
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
              File name: {safeFileName.split(".")[0]}_edited.{getFileExtension()}
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
                  {format === "webp" ? "image/webp" : format === "jpeg" ? "image/jpeg" : safeFileType}
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
    </div>
  )
}
