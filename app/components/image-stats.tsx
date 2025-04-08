"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileType, DownloadCloud, ArrowDownCircle } from "lucide-react";

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageStatsDisplayProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  fileName: string;
  format: string;
  fileType: string;
}

// Format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

export default function ImageStatsDisplay({
  originalStats,
  newStats,
  dataSavings,
  hasEdited,
  fileName,
  format,
  fileType,
}: ImageStatsDisplayProps) {
  // Original image stats
  const originalFormatted = originalStats
    ? {
        dimensions: `${originalStats.width} × ${originalStats.height}`,
        size: formatBytes(originalStats.size),
        format: originalStats.format.toUpperCase(),
      }
    : null;

  // New image stats
  const newFormatted = newStats
    ? {
        dimensions: `${newStats.width} × ${newStats.height}`,
        size: formatBytes(newStats.size),
        format: newStats.format.toUpperCase(),
      }
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <FileType className="mr-2 h-5 w-5 text-blue-500" />
            Original Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <p className="mb-1">
              <span className="font-medium">File:</span> {fileName}
            </p>
            {originalFormatted && (
              <>
                <p className="mb-1">
                  <span className="font-medium">Dimensions:</span>{" "}
                  {originalFormatted.dimensions}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Size:</span>{" "}
                  {originalFormatted.size}
                </p>
                <p>
                  <span className="font-medium">Format:</span>{" "}
                  {originalFormatted.format}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {hasEdited && newFormatted && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <DownloadCloud className="mr-2 h-5 w-5 text-green-500" />
                Edited Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="mb-1">
                  <span className="font-medium">Dimensions:</span>{" "}
                  {newFormatted.dimensions}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Size:</span> {newFormatted.size}
                </p>
                <p>
                  <span className="font-medium">Format:</span>{" "}
                  {format.toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <ArrowDownCircle className="mr-2 h-5 w-5 text-purple-500" />
                Compression Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p className="mb-1">
                  <span className="font-medium">Size Reduction:</span>{" "}
                  {dataSavings > 0
                    ? `${Math.round(dataSavings)}%`
                    : "No reduction"}
                </p>
                {originalStats && newStats && (
                  <p className="mb-1">
                    <span className="font-medium">Space Saved:</span>{" "}
                    {formatBytes(originalStats.size - newStats.size)}
                  </p>
                )}
                {originalStats && newStats && (
                  <p className="mb-1">
                    <span className="font-medium">Dimensions Change:</span>{" "}
                    {newStats.width === originalStats.width &&
                    newStats.height === originalStats.height
                      ? "Unchanged"
                      : `${Math.round(
                          (newStats.width / originalStats.width) * 100
                        )}% width, ${Math.round(
                          (newStats.height / originalStats.height) * 100
                        )}% height`}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
