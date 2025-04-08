"use client";

// Image database functions
export const initImageDB = () => {
  const DB_NAME = "ImageEditorDB";
  const DB_VERSION = 1;
  const STORE_NAME = "images";

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open database"));

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    // Create object store when needed (first time or version upgrade)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the images object store with id as key path
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const getImages = async () => {
  try {
    const db = await initImageDB();
    const transaction = db.transaction(["images"], "readonly");
    const store = transaction.objectStore("images");

    return new Promise<any[]>((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error("Failed to get images"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error getting images:", error);
    return [];
  }
};

export const saveImage = async (image: any) => {
  try {
    const db = await initImageDB();
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");

    return new Promise<void>((resolve, reject) => {
      const request = store.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save image"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
};

export const deleteImage = async (id: string) => {
  try {
    const db = await initImageDB();
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");

    return new Promise<void>((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete image"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

export const clearImages = async () => {
  try {
    const db = await initImageDB();
    const transaction = db.transaction(["images"], "readwrite");
    const store = transaction.objectStore("images");

    return new Promise<void>((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to clear images"));

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error clearing images:", error);
    throw error;
  }
};

// File conversion utilities
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const base64ToBlob = (
  base64Data: string,
  contentType: string = ""
): Blob => {
  // Extract the base64 data part if it includes the data URL prefix
  const base64 = base64Data.includes("base64,")
    ? base64Data.split("base64,")[1]
    : base64Data;

  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

export const createFileFromBase64 = (
  base64Data: string,
  fileName: string,
  fileType: string
): File => {
  // Create blob from base64
  const blob = base64ToBlob(base64Data, fileType);

  // Create file from blob
  return new File([blob], fileName, { type: fileType });
};

// Image format utilities
export const getFileFormat = (fileType: string | undefined): string => {
  if (!fileType || typeof fileType !== "string") return "unknown";
  const parts = fileType.split("/");
  return parts.length > 1 ? parts[1] : "unknown";
};

export const getMimeType = (format: string): string => {
  if (format === "webp") return "image/webp";
  if (format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  return "image/png"; // Default fallback
};

// Function to create a thumbnail from an image
export const createThumbnail = async (
  file: File,
  maxWidth: number = 300
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let width = maxWidth;
        let height = maxWidth / aspectRatio;

        // Set canvas size to new dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image at new size
        ctx.drawImage(img, 0, 0, width, height);

        // Get data URL and resolve
        const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(thumbnailDataUrl);
      };

      img.onerror = () =>
        reject(new Error("Failed to load image for thumbnail"));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

// Helper for safely revoking object URLs
export const safeRevokeObjectURL = (url: string | undefined) => {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn("Failed to revoke object URL:", e);
    }
  }
};
