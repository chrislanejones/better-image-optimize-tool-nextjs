// store/hooks/useDragAndDrop.ts
import { useCallback, useState, useEffect, useRef } from 'react';
import { useImageStore, useImageActions } from '../useImageStore';

interface DragAndDropOptions {
  maxFiles?: number;
  acceptedFileTypes?: string[];
  onFilesAccepted?: (files: File[]) => void;
  onFileRejected?: (file: File, reason: string) => void;
}

export const useDragAndDrop = (options: DragAndDropOptions = {}) => {
  const {
    maxFiles = 50,
    acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    onFilesAccepted,
    onFileRejected,
  } = options;

  const { isDragging } = useImageStore();
  const actions = useImageActions();
  const [isHovering, setIsHovering] = useState(false);
  const filesProcessedRef = useRef<Map<string, boolean>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Track drag enter/leave with counter to handle child elements
  const dragCounterRef = useRef(0);

  // Process files and apply validation
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const remainingSlots = maxFiles - useImageStore.getState().images.length;
    
    if (remainingSlots <= 0) {
      console.warn('Maximum file limit reached');
      return;
    }
    
    // Process files up to the limit
    const filesToProcess = Math.min(fileArray.length, remainingSlots);
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = fileArray[i];
      
      // Skip already processed files (deduplicate)
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      if (filesProcessedRef.current.has(fileId)) {
        continue;
      }
      
      if (acceptedFileTypes.includes(file.type)) {
        validFiles.push(file);
        filesProcessedRef.current.set(fileId, true);
      } else {
        onFileRejected?.(file, 'File type not accepted');
      }
    }
    
    if (validFiles.length > 0) {
      const newImages = validFiles.map(file => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        isNew: true,
      }));
      
      actions.addImages(newImages);
      onFilesAccepted?.(validFiles);
    }
  }, [maxFiles, acceptedFileTypes, actions, onFilesAccepted, onFileRejected]);

  // Individual handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current++;
    
    if (dragCounterRef.current === 1) {
      actions.setIsDragging(true);
      setIsHovering(true);
    }
  }, [actions]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current--;
    
    if (dragCounterRef.current === 0) {
      actions.setIsDragging(false);
      setIsHovering(false);
    }
  }, [actions]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Highlight drop zone if we're directly over it
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounterRef.current = 0;
    actions.setIsDragging(false);
    setIsHovering(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [actions, processFiles]);

  // Paste handler
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      e.preventDefault(); // Prevent paste elsewhere if there are files
      processFiles(e.clipboardData.files);
    }
  }, [processFiles]);
  
  // File input handler
  const handleFileSelect = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      processFiles(input.files);
      // Reset input value to allow selecting the same file again
      input.value = '';
    }
  }, [processFiles]);

  // Setup and cleanup
  useEffect(() => {
    const currentContainer = containerRef.current;
    const handleDocumentPaste = (e: ClipboardEvent) => handlePaste(e);
    
    if (currentContainer) {
      currentContainer.addEventListener('dragenter', handleDragEnter as EventListener);
      currentContainer.addEventListener('dragleave', handleDragLeave as EventListener);
      currentContainer.addEventListener('dragover', handleDragOver as EventListener);
      currentContainer.addEventListener('drop', handleDrop as EventListener);
    }
    
    document.addEventListener('paste', handleDocumentPaste);
    
    return () => {
      if (currentContainer) {
        currentContainer.removeEventListener('dragenter', handleDragEnter as EventListener);
        currentContainer.removeEventListener('dragleave', handleDragLeave as EventListener);
        currentContainer.removeEventListener('dragover', handleDragOver as EventListener);
        currentContainer.removeEventListener('drop', handleDrop as EventListener);
      }
      
      document.removeEventListener('paste', handleDocumentPaste);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handlePaste]);

  // Setup file input
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.addEventListener('change', handleFileSelect);
    }
    
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.removeEventListener('change', handleFileSelect);
      }
    };
  }, [handleFileSelect]);

  // Create a file input if needed
  const createFileInput = useCallback(() => {
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = acceptedFileTypes.join(',');
      input.style.display = 'none';
      input.addEventListener('change', handleFileSelect);
      fileInputRef.current = input;
      document.body.appendChild(input);
    }
    return fileInputRef.current;
  }, [acceptedFileTypes, handleFileSelect]);

  // Trigger file selection dialog
  const openFileDialog = useCallback(() => {
    const input = createFileInput();
    input.click();
  }, [createFileInput]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fileInputRef.current) {
        fileInputRef.current.removeEventListener('change', handleFileSelect);
        document.body.removeChild(fileInputRef.current);
      }
    };
  }, [handleFileSelect]);

  return {
    isDragging,
    isHovering,
    containerRef,
    fileInputRef,
    openFileDialog,
    processFiles,
  };
};

// Dynamic import for react-dropzone integration (optional)
export const useReactDropzone = () => {
  const actions = useImageActions();
  const maxFiles = useImageStore((state) => 50 - state.images.length);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      isNew: true,
    }));
    
    actions.addImages(newImages);
  }, [actions]);
  
  return {
    maxFiles,
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxSize: 10485760, // 10MB
  };
};
