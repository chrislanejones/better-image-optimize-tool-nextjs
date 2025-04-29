"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  FileType,
  DownloadCloud,
  ArrowDownCircle,
  FileBarChart,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ImageStats {
  width: number;
  height: number;
  size: number;
  format: string;
}

interface ImageStatsProps {
  originalStats: ImageStats | null;
  newStats: ImageStats | null;
  dataSavings: number;
  hasEdited: boolean;
  fileName: string;
  format: string;
  fileType: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
  );
};

export default function ImageStats({
  originalStats,
  newStats,
  dataSavings,
  hasEdited,
  fileName,
  format,
  fileType,
}: ImageStatsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const originalFormatted = originalStats
    ? {
        dimensions: `${originalStats.width} × ${originalStats.height}`,
        size: formatBytes(originalStats.size),
        format: originalStats.format.toUpperCase(),
      }
    : null;

  const newFormatted = newStats
    ? {
        dimensions: `${newStats.width} × ${newStats.height}`,
        size: formatBytes(newStats.size),
        format: newStats.format.toUpperCase(),
      }
    : null;

  const savedBytes =
    originalStats && newStats ? originalStats.size - newStats.size : 0;
  const savedKB = Math.max(0, Math.round(savedBytes / 1024));
  const originalSizeKB = originalStats
    ? Math.round(originalStats.size / 1024)
    : 0;
  const newSizeKB = newStats ? Math.round(newStats.size / 1024) : 0;

  const dimensionData =
    originalStats && newStats
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
          { metric: "Size (KB)", original: originalSizeKB, current: newSizeKB },
        ]
      : [];

  const storageData =
    savedBytes > 0
      ? [
          { name: "Current Size", value: newSizeKB },
          { name: "Saved Space", value: savedKB },
        ]
      : [];

  return (
    <div className="space-y-4">
      {hasEdited && originalStats && newStats && isMounted && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center">
                  <FileType className="mr-2 h-5 w-5 text-[hsl(var(--blue))]" />
                  Original Image
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-3">
                <div className="text-sm">
                  {originalFormatted && (
                    <>
                      <p className="mb-1 font-medium">File: {fileName}</p>
                      <p className="mb-1">
                        Dimensions: {originalFormatted.dimensions}
                      </p>
                      <p className="mb-1">Size: {originalFormatted.size}</p>
                      <p>Format: {originalFormatted.format}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center">
                  <DownloadCloud className="mr-2 h-5 w-5 text-[hsl(var(--purple))]" />
                  Edited Image
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 px-3">
                <div className="text-sm">
                  {newFormatted && (
                    <>
                      <p className="mb-1">
                        Dimensions: {newFormatted.dimensions}
                      </p>
                      <p className="mb-1">Size: {newFormatted.size}</p>
                      <p>Format: {format.toUpperCase()}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center">
                  <ArrowDownCircle className="mr-2 h-5 w-5 text-[hsl(var(--light-blue))]" />
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
                  <p className="mb-1">Space Saved: {formatBytes(savedBytes)}</p>
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
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center">
                  <FileBarChart className="mr-2 h-5 w-5 text-[hsl(var(--teal))]" />
                  Dimensions Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-60 w-100 pl-2">
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
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: number) => v.toLocaleString()}
                      />
                      <YAxis
                        dataKey="metric"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10 }}
                        width={65}
                      />
                      <Tooltip
                        formatter={(value: any) => [`${value}`, ""]}
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
                        dataKey="original"
                        fill="hsl(var(--blue))"
                        barSize={12}
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
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

            <Card className="bg-gray-800 text-white border-gray-700">
              <CardHeader className="p-3">
                <CardTitle className="text-base flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-[hsl(var(--soft-yellow))]" />
                  Storage Savings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-60 w-100">
                  {savedBytes > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={storageData}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
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
          </div>
        </>
      )}
    </div>
  );
}
