# ImageHorse 🐎

A powerful, modern image editor and compression tool built with Next.js, React, and TypeScript. Upload multiple images, edit them individually or in bulk, and optimize them for web use with advanced compression algorithms.

![ImageHorse Logo](public/Image-Horse-Logo.svg)

## 🚀 Features

### Core Image Editing

- **Multiple Upload**: Drag & drop, click to browse, or paste from clipboard
- **Individual Editing**: Comprehensive editing tools for single images
- **Bulk Editing**: Apply the same edits to multiple images simultaneously
- **Real-time Preview**: See changes as you make them

### Editing Tools

- **🔧 Resize & Optimize**: Smart compression with Core Web Vitals scoring
- **✂️ Cropping**: Precise crop tool with aspect ratio controls
- **🌫️ Blur Tool**: Selective blur with adjustable intensity and brush size
- **🎨 Paint Tool**: Full painting suite with brushes, erasers, arrows, and emojis
- **📝 Text Tool**: Add text with multiple fonts, sizes, colors, and styling options
- **🔄 Transform**: Rotate, flip horizontal/vertical, and reset transformations

### Advanced Features

- **Bulk Operations**: Crop multiple images with the same dimensions
- **Format Conversion**: JPEG, PNG, WebP support with quality controls
- **Compression Levels**: From lossless to extreme compression
- **Core Web Vitals**: Real-time performance impact visualization
- **Zoom Controls**: Detailed editing with up to 3x zoom
- **History**: Undo/redo functionality with complete edit history
- **Dark/Light Mode**: Automatic theme switching

### File Management

- **Pagination**: Navigate through large image collections
- **Grid View**: Thumbnail overview of all uploaded images
- **Individual Downloads**: Save edited images in your preferred format
- **Bulk Downloads**: Download all processed images at once

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: shadcn/ui component library
- **Image Processing**: HTML Canvas API with optimized algorithms
- **State Management**: React hooks with custom state management
- **Icons**: Lucide React
- **Charts**: Recharts for statistics visualization

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/imagehorse.git
   cd imagehorse
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage Guide

### Getting Started

1. **Upload Images**: Drag & drop images, click "Select Images", or paste from clipboard
2. **Choose Mode**:
   - Single image editing for detailed work
   - Bulk editing for applying same changes to multiple images
3. **Edit**: Use the toolbar to access different editing tools
4. **Export**: Download your edited images in your preferred format

### Individual Editing Mode

- Click "Edit Image Mode" to enter detailed editing
- Use the sidebar tools for resizing and compression
- Access advanced tools via the main toolbar
- View real-time statistics and Core Web Vitals impact

### Bulk Editing Mode

- Click "Bulk Image Edit" when multiple images are loaded
- Select the main image to use as a template
- Apply bulk crops that will be applied to all images
- Preview how changes will affect each image

### Compression & Optimization

- **Smart Compression**: Automatically optimizes images for web use
- **Format Selection**: Choose between JPEG, PNG, and WebP
- **Quality Controls**: Fine-tune compression levels
- **Size Prediction**: See file size changes before applying
- **Core Web Vitals**: Understand performance impact

## 🏗️ Project Structure

```
imagehorse/
├── app/                          # Next.js app directory
│   ├── components/              # React components
│   │   ├── blur-tool.tsx       # Selective blur tool
│   │   ├── cropping-tool.tsx   # Image cropping utility
│   │   ├── image-editor-*.tsx  # Main editor components
│   │   ├── paint-tool.tsx      # Painting and drawing tools
│   │   ├── text-tool.tsx       # Text overlay tool
│   │   └── ui/                 # shadcn/ui components
│   ├── constants/              # Application constants
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   │   ├── image-processing.ts # Core image processing
│   │   └── image-utils.ts      # Image manipulation utilities
│   ├── bulk-image-editor.tsx   # Bulk editing interface
│   ├── image-editor.tsx        # Main editor component
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page component
├── components/                  # Global components
├── hooks/                      # Global hooks
├── lib/                        # Library utilities
├── styles/                     # CSS and styling
└── types/                      # TypeScript definitions
```

## 🔧 Key Components

### ImageEditor

The main editing interface that handles:

- Tool switching and state management
- Image transformations and filters
- Export and download functionality
- History management for undo/redo

### BulkImageEditor

Specialized interface for bulk operations:

- Multi-image crop preview
- Synchronized editing across images
- Batch processing capabilities
- Progress tracking and feedback

### Individual Tools

Each editing tool is a self-contained component:

- **CroppingTool**: Drag-to-crop with aspect ratio controls
- **BlurTool**: Brush-based selective blur with size/intensity controls
- **PaintTool**: Complete painting suite with multiple brush types
- **TextTool**: Rich text editing with font, size, and styling options

## 🎨 Styling & Theming

- **Design System**: Consistent design tokens via Tailwind CSS
- **Dark/Light Mode**: Automatic theme detection and switching
- **Responsive**: Mobile-first design that works on all devices
- **Animations**: Smooth transitions and micro-interactions
- **Accessibility**: WCAG compliant with proper contrast and focus management

## 📊 Performance Features

### Core Web Vitals Integration

- **LCP Optimization**: Image size impact on Largest Contentful Paint
- **Performance Scoring**: Real-time feedback on optimization choices
- **Smart Compression**: Automatic optimization based on content type
- **Format Recommendations**: Suggests best format for each use case

### Compression Algorithms

- **Multi-pass Compression**: Iterative optimization for best results
- **Content-aware**: Different strategies for photos vs graphics
- **Quality Preservation**: Maintains visual quality while reducing file size
- **Format Conversion**: Seamless conversion between image formats

## 🔄 State Management

The application uses a combination of:

- **React Hooks**: useState, useCallback, useEffect for local state
- **Custom Hooks**: Shared logic in reusable hooks (useImageEditor)
- **Context**: Theme and toast notifications
- **Refs**: Direct DOM manipulation for canvas operations

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start

# Build and analyze bundle
npm run analyze
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Optional: Error tracking
SENTRY_DSN=your_sentry_dsn
```

### Customization

- **Themes**: Modify `tailwind.config.js` for custom colors
- **Compression**: Adjust settings in `constants/editorConstants.ts`
- **Tools**: Add new editing tools in the `components/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- **TypeScript**: Strict typing for all components and utilities
- **Component Structure**: Follow the established component patterns
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update README and code comments

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Contributing**: See the Contributing section above

## 🏆 Acknowledgments

- **shadcn/ui**: For the excellent component library
- **Lucide**: For the beautiful icon set
- **Recharts**: For data visualization components
- **Next.js Team**: For the amazing framework
- **Vercel**: For hosting and deployment tools

## 🚦 Status

- ✅ Core image editing functionality
- ✅ Bulk editing capabilities
- ✅ Advanced compression algorithms
- ✅ Responsive design and accessibility
- 🚧 AI-powered editing features (coming soon)
- 🚧 Cloud storage integration (planned)
- 🚧 Advanced batch processing (in development)

---

Made with ❤️ for the web development community. Happy editing! 🎨
