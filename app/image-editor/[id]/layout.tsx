// This is a server component (no "use client" directive)
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Image Editor",
  description: "Edit, crop, and enhance your images",
};

export default function ImageEditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
