import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadCloud } from "lucide-react";

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageStatsDimensionsProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  spaceSaved: string;
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

export default function ImageStatsDimensions({
  originalStats,
  newStats,
  spaceSaved,
}: ImageStatsDimensionsProps) {
  // Add this to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Data for bar chart - simplified to just show dimensions and size
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

  if (!originalStats) {
    return null;
  }

  return (
    <Card className="rounded-lg border shadow-sm bg-gray-800 text-white border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <DownloadCloud className="mr-2 h-5 w-5 text-primary" />
          Image Dimensions
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="h-[200px] w-full">
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
                barSize={20}
              >
                <defs>
                  <linearGradient
                    id="colorOriginal"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="currentColor" />
                <YAxis stroke="currentColor" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    borderColor: "#374151",
                    color: "#f9fafb",
                  }}
                />
                <Bar
                  dataKey="original"
                  name="Original"
                  fill="url(#colorOriginal)"
                  radius={[10, 10, 0, 0]}
                  animationBegin={0}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="current"
                  name="Current"
                  fill="url(#colorCurrent)"
                  radius={[10, 10, 0, 0]}
                  animationBegin={300}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {spaceSaved && (
          <div className="text-center mt-1 text-sm font-medium text-green-400">
            Space saved: {spaceSaved}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
