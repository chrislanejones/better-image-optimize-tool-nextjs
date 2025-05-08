- Multi-image support feature coming out in the next few days! - by Saturday May 10th 2025

# ✨ Transform Your Images for the Web – Like Magic!

## 🚀 Live Demo

**Try it now:** [https://better-image-optimize-tool-nextjs.vercel.app/](https://better-image-optimize-tool-nextjs.vercel.app/)

Upload, edit, and optimize your images instantly. See performance improvements in real time!

---

## 📈 Why Image Optimization Matters

Slow-loading images frustrate users and hurt your Core Web Vitals. This tool helps you:

- **Speed up your site** for better UX and SEO
- **Meet Google’s Core Web Vitals** (LCP, CLS, INP)
- **Reduce bandwidth and storage costs**

Learn more: [Google’s Core Web Vitals](https://web.dev/vitals/)

---

## 🛠️ Key Features

- **Complete Image Editing Suite:** Crop, blur, paint, add text, and resize
- **Core Web Vitals Optimization:** One-click, smart resizing for web performance
- **Visual Statistics:** See file size reduction and dimension changes live
- **Zoom View:** Magnify image details with a crosshair tool
- **Mobile-Friendly:** Fully responsive, works on all devices
- **Multi-Image Support:** Upload and edit up to 50 images at once
- **Pagination:** Navigate large galleries easily
- **Persistent Storage:** Images saved to IndexedDB for session persistence
- **Format Conversion:** Convert between JPEG, PNG, and WebP

---

## 🧩 Main Components

| Component                | Location                                | Purpose/Features                                               |
| ------------------------ | --------------------------------------- | -------------------------------------------------------------- |
| **CroppingTool**         | `components/cropping-tool.tsx`          | Crop images with ReactCrop                                     |
| **BlurBrushCanvas**      | `components/blur-canvas.tsx`            | Selective blur with adjustable brush                           |
| **PaintTool**            | `components/paint-tool.tsx`             | Draw/erase with color and size controls                        |
| **TextTool**             | `components/text-tool.tsx`              | Add, move, and style text overlays                             |
| **ImageResizer**         | `components/image-resizer.tsx`          | Resize images, lock aspect ratio, optimize for Core Web Vitals |
| **ImageZoomView**        | `components/image-zoom-view.tsx`        | Magnifier with crosshair and zoom controls                     |
| **ImageStats**           | `components/image-stats.tsx`            | Visualize original vs. edited stats, compression, and savings  |
| **ImageControls**        | `components/image-controls.tsx`         | Unified toolbar for all editing actions                        |
| **EditorControls**       | `components/editor-controls.tsx`        | Tool-specific controls (blur, paint, text)                     |
| **MultiImageEditor**     | `multi-editor.tsx`                      | Batch crop, resize, and manage multiple images                 |
| **ImageUploader**        | `components/image-uploader.tsx`         | Drag & drop, paste, or select images; clipboard support        |
| **EnhancedImageGallery** | `components/enhanced-image-gallery.tsx` | Gallery with pagination, selection, and removal                |

---

## 🧠 Utility Functions

| File                             | Purpose/Functions                                              |
| -------------------------------- | -------------------------------------------------------------- |
| `utils/image-transformations.ts` | Crop, resize, convert, and process images; safe URL management |
| `utils/image-utils.ts`           | Format/MIME helpers                                            |
| `utils/indexedDB.ts`             | Persistent image storage (save, update, delete, fetch)         |

---

## 🖼️ Gallery & UX

- **Up to 50 images** with smooth pagination (10 per page)
- **Drag & drop** and **clipboard paste** support
- **Animated transitions** for new images and gallery state changes
- **Responsive**: Looks great on mobile and desktop
- **Batch operations**: Multi-edit mode for cropping/resizing multiple images (more batch features coming soon!)

---

## ⚡ Core Web Vitals Optimization

- **One-click optimization**: Instantly resize images to max 1000px width, preserve aspect ratio, and compress for web
- **Automatic format selection**: Choose JPEG, PNG, or WebP for best results
- **Live stats**: See how much space and load time you save

---

## 🏗️ Technical Overview

- **Framework**: Next.js 14+, React 18+
- **State**: React hooks (`useState`, `useEffect`, `useCallback`, `useRef`)
- **Storage**: IndexedDB for persistent images, `URL.createObjectURL` for fast previews
- **Performance**: Lazy loading, memory cleanup, memoized callbacks, and efficient rendering
- **Type Safety**: All major types defined in `types/editor.ts`

---

## 📝 How to Use

1. **Upload Images**: Drag & drop, paste, or use the file picker
2. **Select an Image**: Click a thumbnail to edit
3. **Edit**: Use crop, blur, paint, or text tools
4. **Optimize**: Click “Optimize for Core Web Vitals” for instant web-ready images
5. **Download**: Save your optimized image in your preferred format

---

## 🚦 Roadmap & Future Enhancements

- More image filters and effects
- Undo/redo support
- Image rotation and flipping
- Layer support
- Advanced batch editing (resize, compress, watermark, etc.)
- AI-powered optimization suggestions
- Gallery sorting/filtering

---

## 🛠️ Installation & Development

```bash
git clone https://github.com/your-username/better-image-optimize-tool-nextjs.git
cd better-image-optimize-tool-nextjs
npm install
npm run dev
```

- **Build for production:** `npm run build`
- **Deploy:** Vercel, Netlify, or your favorite platform

---

## 🤝 Contributing

This project is open source and contributions are welcome!  
Feel free to open issues, suggest features, or submit pull requests.

---

## 📄 License

MIT

---

**Transform your images. Transform your web performance.**

---

Let me know if you want a more detailed section on any feature, or if you want to include screenshots, badges, or a FAQ!
