"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageStatsChartProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  hasEdited: boolean;
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

export default function ImageStatsChart({
  originalStats,
  newStats,
  hasEdited,
}: ImageStatsChartProps) {
  // Add this to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!hasEdited || !originalStats || !newStats) {
    return null;
  }

  // Transform data for the chart
  const chartData = [
    {
      metric: "Width",
      original: originalStats.width,
      current: newStats.width,
      originalFill: "hsl(var(--chart-1))",
      currentFill: "hsl(var(--chart-2))",
    },
    {
      metric: "Height",
      original: originalStats.height,
      current: newStats.height,
      originalFill: "hsl(var(--chart-1))",
      currentFill: "hsl(var(--chart-2))",
    },
    {
      metric: "Size (KB)",
      original: Math.round(originalStats.size / 1024),
      current: Math.round(newStats.size / 1024),
      originalFill: "hsl(var(--chart-1))",
      currentFill: "hsl(var(--chart-2))",
    },
  ];

  // Calculate space saved
  const spaceSaved = Math.max(0, originalStats.size - newStats.size);
  const spaceSavedFormatted = formatBytes(spaceSaved);

  // Chart configuration
  const chartConfig = {
    original: {
      label: "Original",
      color: "hsl(var(--chart-1))",
    },
    current: {
      label: "Current",
      color: "hsl(var(--chart-2))",
    },
    metric: {
      label: "Metric",
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <DownloadCloud className="mr-2 h-5 w-5" />
          Image Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMounted && (
          <div className="h-[200px] w-full">
            <ChartContainer config={chartConfig}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{
                  left: 70,
                  right: 20,
                  top: 10,
                  bottom: 10,
                }}
              >
                <YAxis
                  dataKey="metric"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                />
                <XAxis dataKey="original" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="original"
                  fill="hsl(var(--chart-1))"
                  radius={[5, 0, 0, 5]}
                  name="Original"
                />
                <Bar
                  dataKey="current"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 5, 5, 0]}
                  name="Current"
                />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {spaceSaved > 0 && (
          <div className="text-center mt-2 text-sm">
            Space saved:{" "}
            <span className="font-medium">{spaceSavedFormatted}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
