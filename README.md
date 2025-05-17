# ImageHorse - Advanced Image Editor

ImageHorse is a modern, feature-rich image editing application built with React and Next.js. It provides intuitive tools for image manipulation, optimization, and editing with a responsive user interface.

![ImageHorse Logo](/Image-Horse-Logo.svg)

## Live Demo

**Try it now:** [https://better-image-optimize-tool-nextjs.vercel.app/](https://better-image-optimize-tool-nextjs.vercel.app/)

## 🌟 Features

- **Multiple Image Upload**: Drag-and-drop, file select, or paste from clipboard
- **Image Gallery**: Browse and manage multiple uploaded images
- **Advanced Editing Tools**:
  - Crop with aspect ratio control
  - Selective blur tool with adjustable radius and intensity
  - Paint and drawing tools with customizable brushes
  - Text overlay with font selection and styling
  - Rotation tools (clockwise and counter-clockwise)
- **Image Optimization**:
  - Resize with maintained aspect ratio
  - Format conversion (JPEG, PNG, WebP)
  - Quality adjustment with Core Web Vitals scoring
  - File size reduction with statistics
- **Real-time Statistics**: View detailed metrics about your edits
- **Image Comparison**: Before/after visualization
- **Zoom Controls**: Precision editing with zoom in/out functionality
- **Pagination**: Efficiently handle large numbers of images
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes

## 🧩 Architecture

The application is built with a modular component architecture:

```
📦 app
 ┣ 📂 components
 ┃ ┣ 📜 blur-tool.tsx         # Selective blur brush tool
 ┃ ┣ 📜 cropping-tool.tsx     # Image cropping with aspect ratio control
 ┃ ┣ 📜 image-resizer.tsx     # Size and format adjustment
 ┃ ┣ 📜 image-stats.tsx       # Image metrics visualization
 ┃ ┣ 📜 image-zoom-view.tsx   # Zoomed image preview
 ┃ ┣ 📜 paint-tool.tsx        # Drawing and painting functionality
 ┃ ┣ 📜 pagination-controls.tsx # Image navigation controls
 ┃ ┣ 📜 text-tool.tsx         # Text overlay with styling
 ┃ ┗ 📜 toolbar.tsx           # Editor toolbar with action buttons
 ┣ 📂 utils
 ┃ ┣ 📜 image-transformations.js # Image processing utilities
 ┃ ┣ 📜 image-utils.js        # Helper functions
 ┃ ┗ 📜 indexedDB.js          # Local storage for images
 ┣ 📜 image-cropper.tsx       # Main cropper component
 ┣ 📜 image-editor.tsx        # Main editor component
 ┣ 📜 layout.tsx              # Application layout
 ┗ 📜 page.tsx                # Main entry point and image upload
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/image-horse.git
   cd image-horse
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 💻 Usage

### Upload Images

- **Drag & Drop**: Drag images into the upload area
- **File Select**: Click the upload area to browse files
- **Clipboard**: Paste images directly (Ctrl+V / Cmd+V)

### Edit Images

1. Select an image from the gallery
2. Use the toolbar to choose editing mode:
   - **Resize & Optimize**: Adjust dimensions, quality, and format
   - **Edit Image**: Access advanced editing tools
3. Apply changes with the respective "Apply" button
4. Download your edited image or continue editing

### Navigation

- Use pagination controls to navigate between multiple images
- In edit mode, the toolbar provides access to different tools
- Return to the gallery view from edit mode using the "Back to Gallery" button

## 🔧 Advanced Features

### Core Web Vitals Optimization

The image resizer provides feedback on how your image optimization will impact Core Web Vitals performance metrics, helping you make informed decisions about size, format, and quality settings.

### Format Selection

- **WebP**: Best overall compression and quality (recommended)
- **JPEG**: Good for photographs with wide browser support
- **PNG**: Best for images with transparency

### IndexedDB Storage

Images are stored locally in your browser using IndexedDB, allowing for persistent editing across sessions without uploading to a server.

## 🛠️ Recent Fixes and Improvements

- **Accurate Cropping**: Fixed scaling issues in the crop tool to ensure precise cropping across the entire image
- **Edit Mode Preservation**: Improved state management to maintain edit mode after operations like rotation
- **Enhanced Compression**: Optimized image compression algorithm for better quality-to-size ratio
- **Core Web Vitals Scoring**: Added real-time performance impact visualization

## 🔗 Dependencies

- React/Next.js for UI framework
- Tailwind CSS for styling
- Lucide React for icons
- React Image Crop for cropping functionality
- Recharts for statistics visualization
- IndexedDB for local storage

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by Your Team
