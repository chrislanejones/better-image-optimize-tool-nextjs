# Image Editor Refactoring Guide

## Overview

This guide explains the refactoring of the `image-cropper.tsx` component into smaller, more manageable pieces. The original component was quite large and handled many responsibilities, making it difficult to maintain and extend.

## Components Created

### 1. CroppingTool

- Location: `components/cropping-tool.tsx`
- Purpose: Handles image cropping functionality
- Dependencies: ReactCrop library

### 2. BlurTool

- Location: `components/blur-tool.tsx`
- Purpose: Provides image blur functionality
- Features: Adjustable blur intensity

### 3. PaintTool

- Location: `components/paint-tool.tsx`
- Purpose: Allows drawing on the image
- Features: Brush size, color picker, eraser

### 4. ImageResizer

- Location: `components/image-resizer.tsx`
- Purpose: Controls image dimensions
- Features: Width/height sliders, aspect ratio lock

### 5. ImageZoomView

- Location: `components/image-zoom-view.tsx`
- Purpose: Provides a detailed zoom view of the image
- Features: Adjustable magnification, crosshair

### 6. ImageStatsDisplay

- Location: `components/image-stats-display.tsx`
- Purpose: Shows image information
- Features: Original/edited comparison, compression stats

## Utility Functions

### image-transformations.ts

- Location: `utils/image-transformations.ts`
- Purpose: Contains image processing logic
- Functions:
  - `cropImage`: Crop an image at specified coordinates
  - `resizeImage`: Change image dimensions
  - `urlToBlob`: Convert a URL to a Blob
  - `getImageDetails`: Get image dimensions
  - `calculateSizeReduction`: Calculate size reduction percentage
  - `generateDownloadURL`: Create downloadable URL
  - `createDownloadLink`: Generate download link
  - `safeRevokeURL`: Safely revoke object URLs

## Implementation Details

### State Management

The simplified `image-cropper.tsx` now manages:

- Basic image state (dimensions, format)
- Edit mode states
- Stats for comparison

### Component Communication

Components interact through:

- Props for data passing
- Callback functions for events
- Shared utility functions

### Performance Improvements

- Reduced re-renders by extracting independent components
- Better memory management with URL revocation
- Cleaner code structure with focused components

## How to Use

1. The main entry point is still `image-cropper.tsx`
2. Import required components based on functionality
3. Use utility functions for image processing tasks

## Future Enhancements

Possible improvements:

- Add more image filters
- Implement undo/redo functionality
- Create a proper state management solution
- Add image rotation and flipping
- Support for image layers

## Migration Guide

To migrate from the old implementation:

1. Replace the original `image-cropper.tsx` with the simplified version
2. Add all the new component files
3. Add the utility functions file
4. Ensure all dependencies are installed (e.g., react-image-crop)
