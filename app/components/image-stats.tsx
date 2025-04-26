"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud, ArrowDownCircle } from "lucide-react";
import dynamic from "next/dynamic";

// Import the charts as a single component to avoid type issues
const ChartComponents = dynamic(
  () => import("./charts").then((mod) => mod.default),
  { ssr: false }
);

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
  // Add this to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Calculate width/height percentage change
  const widthChange =
    originalStats && newStats
      ? Math.round((newStats.width / originalStats.width) * 100)
      : 100;

  const heightChange =
    originalStats && newStats
      ? Math.round((newStats.height / originalStats.height) * 100)
      : 100;

  // Data for bar chart
  const barData = [
    {
      name: "Width",
      original: originalStats?.width || 0,
      current: newStats?.width || 0,
    },
    {
      name: "Height",
      original: originalStats?.height || 0,
      current: newStats?.height || 0,
    },
    {
      name: "Size (KB)",
      original: originalStats ? Math.round(originalStats.size / 1024) : 0,
      current: newStats ? Math.round(newStats.size / 1024) : 0,
    },
  ];

  // Data for donut chart
  const pieData =
    originalStats && newStats
      ? [
          {
            name: "Saved",
            value: Math.max(0, originalStats.size - newStats.size),
          },
          { name: "Current", value: newStats.size },
        ]
      : [{ name: "Original", value: originalStats?.size || 0 }];

  // Calculate space saved
  const spaceSaved =
    originalStats && newStats
      ? formatBytes(Math.max(0, originalStats.size - newStats.size))
      : "0 Bytes";

  if (!hasEdited || !originalFormatted) {
    // Don't show anything if no edits have been made
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bar Chart (1/2) - Now includes original file info */}
      <Card className="rounded-lg border shadow-sm bg-gray-800 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <DownloadCloud className="mr-2 h-5 w-5 text-primary" />
            Image Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-0">
          <div className="h-[180px] w-full">
            {isMounted && (
              <ChartComponents
                type="bar"
                data={barData}
                spaceSaved={spaceSaved}
                colors={["hsl(var(--chart-1))", "hsl(var(--chart-2))"]}
              />
            )}
          </div>
          <div className="text-sm mt-2 grid grid-cols-2 gap-x-4">
            {/* Left column - Original info */}
            <div>
              <p>
                <span className="font-medium">Original File:</span> {fileName}
              </p>
              <p>
                <span className="font-medium">Original Size:</span>{" "}
                {originalFormatted.size}
              </p>
              <p>
                <span className="font-medium">Original Format:</span>{" "}
                {originalFormatted.format}
              </p>
            </div>
            {/* Right column - New info */}
            <div>
              <p>
                <span className="font-medium">New Dimensions:</span>{" "}
                {newFormatted?.dimensions || "N/A"}
              </p>
              <p>
                <span className="font-medium">New Size:</span>{" "}
                {newFormatted?.size || "N/A"}
              </p>
              <p>
                <span className="font-medium">New Format:</span>{" "}
                {format.toUpperCase()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donut Chart (1/2) */}
      <Card className="rounded-lg border shadow-sm bg-gray-800 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <ArrowDownCircle className="mr-2 h-5 w-5 text-primary" />
            Compression Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[180px]">
            {isMounted && (
              <ChartComponents
                type="pie"
                data={pieData}
                spaceSaved={spaceSaved}
                colors={["hsl(var(--chart-3))", "hsl(var(--chart-4))"]}
              />
            )}
          </div>
          <div className="text-sm mt-2 grid grid-cols-2 gap-x-4">
            <div>
              <p>
                <span className="font-medium">Original Dimensions:</span>{" "}
                {originalFormatted.dimensions}
              </p>
              <p>
                <span className="font-medium">Size Reduction:</span>{" "}
                {dataSavings > 0
                  ? `${Math.round(dataSavings)}%`
                  : "No reduction"}
              </p>
            </div>
            <div>
              <p>
                <span className="font-medium">Space Saved:</span>{" "}
                {formatBytes(
                  Math.max(
                    0,
                    (originalStats?.size || 0) - (newStats?.size || 0)
                  )
                )}
              </p>
              <p>
                <span className="font-medium">Dimensions Change:</span>{" "}
                {newStats?.width === originalStats?.width &&
                newStats?.height === originalStats?.height
                  ? "Unchanged"
                  : `${widthChange}% width, ${heightChange}% height`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
