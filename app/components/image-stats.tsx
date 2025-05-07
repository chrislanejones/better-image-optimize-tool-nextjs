import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FileType,
  ArrowDownCircle,
  FileBarChart,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useImageStats } from "@/store/hooks/useImageStats";

interface ImageStatsDisplayProps {
  className?: string;
  fileName?: string;
  hasEdited?: boolean;
  fileType?: string;
  format?: string;
}

export default function ImageStatsDisplay({
  className,
  fileName = "image.png",
  hasEdited = false,
  fileType = "image/png",
  format = "png",
}: ImageStatsDisplayProps) {
  const { originalStats, newStats, dataSavings } = useImageStats();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!originalStats || !isMounted) {
    return null;
  }

  // Parse file name
  const displayName =
    fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName;

  // Create dimension data for the bar chart
  const dimensionData = newStats
    ? [
        {
          metric: "Width",
          original: originalStats.width,
          current: newStats.width,
        },
        {
          metric: "Height",
          original: originalStats.height,
          current: newStats.height,
        },
        {
          metric: "Size (KB)",
          original: Math.round(originalStats.size / 1024),
          current: Math.round(newStats.size / 1024),
        },
      ]
    : [];

  // Create storage data for the pie chart
  const originalSizeKB = Math.round(originalStats.size / 1024);
  const newSizeKB = newStats ? Math.round(newStats.size / 1024) : 0;
  const savedKB = Math.max(0, originalSizeKB - newSizeKB);

  const storageData =
    savedKB > 0
      ? [
          { name: "Current Size", value: newSizeKB },
          { name: "Saved Space", value: savedKB },
        ]
      : [];

  // Format bytes function
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Row 1: Original Image, Dimensions, Storage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-800 text-white border-gray-700">
          <CardHeader className="p-3">
            <CardTitle className="text-base flex items-center">
              <FileType className="mr-2 h-5 w-5 text-blue-500" />
              Original Image
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3 px-3">
            <div className="text-sm">
              <p className="mb-1 font-medium">File: {displayName}</p>
              <p className="mb-1">
                Dimensions: {originalStats.width} × {originalStats.height}
              </p>
              <p className="mb-1">Size: {formatBytes(originalStats.size)}</p>
              <p>Format: {originalStats.format.toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        {hasEdited && originalStats && newStats && (
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader className="p-3">
              <CardTitle className="text-base flex items-center">
                <FileBarChart className="mr-2 h-5 w-5 text-teal-500" />
                Dimensions Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-60 w-full pl-2">
                <ResponsiveContainer width="80%" height="100%">
                  <BarChart
                    data={dimensionData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, bottom: 0, left: 30 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 14, fill: "white" }}
                      tickFormatter={(v) => v.toLocaleString()}
                    />
                    <YAxis
                      dataKey="metric"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 14, fill: "white" }}
                      width={65}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}`, ""]}
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        borderColor: "hsl(var(--blue))",
                        fontSize: "11px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        color: "white",
                      }}
                    />
                    <Bar
                      name="Original"
                      dataKey="original"
                      fill="hsl(var(--blue))"
                      barSize={12}
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      name="Current"
                      dataKey="current"
                      fill="hsl(var(--purple))"
                      barSize={12}
                      radius={[0, 4, 4, 0]}
                    />
                    <Legend
                      align="center"
                      verticalAlign="bottom"
                      height={24}
                      iconSize={8}
                      wrapperStyle={{ fontSize: "10px" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {hasEdited && (
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader className="p-3">
              <CardTitle className="text-base flex items-center">
                <FileText className="mr-2 h-5 w-5 text-yellow-400" />
                Storage Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-60 w-full">
                {savedKB > 0 ? (
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={storageData}
                        nameKey="name"
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ percent }) =>
                          `${Math.round((percent ?? 0) * 100)}%`
                        }
                        labelLine={false}
                      >
                        <Cell key="cell-0" fill="hsl(var(--light-blue))" />
                        <Cell key="cell-1" fill="hsl(var(--teal))" />
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} KB`]}
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          borderColor: "hsl(var(--teal))",
                          fontSize: "11px",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          color: "white",
                        }}
                      />
                      <Legend
                        align="center"
                        verticalAlign="bottom"
                        iconSize={8}
                        wrapperStyle={{ fontSize: "10px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">No size reduction</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 2: Edited Image and Compression Results */}
      {hasEdited && originalStats && newStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader className="p-3">
              <CardTitle className="text-base flex items-center">
                <ArrowDownCircle className="mr-2 h-5 w-5 text-blue-500" />
                Edited Image
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-3">
              <div className="text-sm">
                <p className="mb-1">
                  Dimensions: {newStats.width} × {newStats.height}
                </p>
                <p className="mb-1">Size: {formatBytes(newStats.size)}</p>
                <p>Format: {format.toUpperCase()}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 text-white border-gray-700">
            <CardHeader className="p-3">
              <CardTitle className="text-base flex items-center">
                <FileText className="mr-2 h-5 w-5 text-green-500" />
                Compression Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3 px-3">
              <div className="text-sm">
                <p className="mb-1">
                  Size Reduction:{" "}
                  {dataSavings > 0
                    ? `${Math.round(dataSavings)}%`
                    : "No reduction"}
                </p>
                <p className="mb-1">
                  Space Saved: {formatBytes(originalStats.size - newStats.size)}
                </p>
                <p className="mb-1">
                  Dimensions Change:{" "}
                  {newStats.width === originalStats.width &&
                  newStats.height === originalStats.height
                    ? "Unchanged"
                    : `${Math.round(
                        (newStats.width / originalStats.width) * 100
                      )}% width, ${Math.round(
                        (newStats.height / originalStats.height) * 100
                      )}% height`}
                </p>
                {dataSavings > 20 && (
                  <p className="mt-2 text-green-400 font-medium">
                    ✓ Image successfully optimized
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
