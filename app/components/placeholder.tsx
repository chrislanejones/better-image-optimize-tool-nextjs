"use client";

import { ReactNode } from "react";

interface ImagePlaceholderProps {
  className?: string;
  alt?: string;
}

export function ImagePlaceholder({
  className = "",
  alt = "Image placeholder",
}: ImagePlaceholderProps) {
  return (
    <div className={`image-placeholder placeholder-shimmer ${className}`}>
      <span className="sr-only">{alt}</span>
    </div>
  );
}

interface LoadingPlaceholderProps {
  text?: string;
  className?: string;
}

export function LoadingPlaceholder({
  text = "Loading...",
  className = "",
}: LoadingPlaceholderProps) {
  return (
    <div className={`loading-placeholder ${className}`}>
      <div className="loading-spinner mb-3"></div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
    </div>
  );
}

interface EmptyPlaceholderProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export function EmptyPlaceholder({
  icon,
  title,
  description,
  children,
  className = "",
}: EmptyPlaceholderProps) {
  return (
    <div className={`empty-placeholder ${className}`}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}

interface MagnifierPlaceholderProps {
  className?: string;
}

export function MagnifierPlaceholder({
  className = "",
}: MagnifierPlaceholderProps) {
  return (
    <div className={`magnifier-placeholder ${className}`}>
      <div className="magnifier-crosshair">
        <div className="magnifier-circle"></div>
      </div>
    </div>
  );
}
