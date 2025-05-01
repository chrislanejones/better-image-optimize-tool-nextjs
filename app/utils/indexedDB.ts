"use client";

import { base64ToBlob, getFileFormat } from "./image-utils";

// IndexedDB configuration
const DB_CONFIG = {
  name: "ImageEditorDB",
  version: 1,
  storeName: "images",
};

// Types
export interface StoredImage {
  id: string;
  name: string;
  type: string;
  fileData: string; // base64 encoded file data
  url?: string;
  width?: number;
  height?: number;
  lastModified?: number;
  metadata?: Record<string, any>;
}

export interface ImageRecord {
  id: string;
  file: File;
  url: string;
  width?: number;
  height?: number;
  metadata?: Record<string, any>;
}

/**
 * Generic class for IndexedDB operations
 */
class IndexedDBStore<T extends { id: string }> {
  private dbName: string;
  private version: number;
  private storeName: string;

  constructor(dbName: string, version: number, storeName: string) {
    this.dbName = dbName;
    this.version = version;
    this.storeName = storeName;
  }

  /**
   * Open a connection to the database
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () =>
        reject(new Error(`Failed to open ${this.dbName} database`));

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "id" });
        }
      };
    });
  }

  /**
   * Execute a transaction on the database
   */
  private async transaction<R>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest<R>
  ): Promise<R> {
    const db = await this.openDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], mode);
      const store = transaction.objectStore(this.storeName);

      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Add or update an item in the store
   */
  async put(item: T): Promise<void> {
    await this.transaction("readwrite", (store) => store.put(item));
  }

  /**
   * Get an item by id
   */
  async get(id: string): Promise<T | undefined> {
    try {
      const result = await this.transaction("readonly", (store) =>
        store.get(id)
      );
      return result;
    } catch (error) {
      console.error(`Error getting item ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Get all items in the store
   */
  async getAll(): Promise<T[]> {
    try {
      const result = await this.transaction("readonly", (store) =>
        store.getAll()
      );
      return result || [];
    } catch (error) {
      console.error("Error getting all items:", error);
      return [];
    }
  }

  /**
   * Delete an item by id
   */
  async delete(id: string): Promise<void> {
    await this.transaction("readwrite", (store) => store.delete(id));
  }

  /**
   * Delete all items in the store
   */
  async clear(): Promise<void> {
    await this.transaction("readwrite", (store) => store.clear());
  }

  /**
   * Update an item with partial data
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    try {
      // First get the existing item
      const item = await this.get(id);

      if (!item) {
        throw new Error(`Item with id ${id} not found`);
      }

      // Update with new data
      const updatedItem = { ...item, ...updates };

      // Save the updated item
      await this.put(updatedItem);
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  }
}

// Initialize the image store
const imageStore = new IndexedDBStore<StoredImage>(
  DB_CONFIG.name,
  DB_CONFIG.version,
  DB_CONFIG.storeName
);

/**
 * Convert a File to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Create a File from base64 data
 */
export function createFileFromBase64(
  base64Data: string,
  fileName: string,
  fileType: string
): File {
  try {
    // Ensure base64 data has the correct prefix
    let processedBase64 = base64Data;
    if (!base64Data.includes("base64,")) {
      processedBase64 = `data:${fileType};base64,${base64Data}`;
    }

    // Create blob from base64
    const blob = base64ToBlob(processedBase64, fileType);

    // Create file from blob
    return new File([blob], fileName, { type: fileType });
  } catch (error) {
    console.error("Error creating file from base64:", error);
    // Return a placeholder file to prevent application crashes
    return new File([new Blob([""], { type: "text/plain" })], "error.txt", {
      type: "text/plain",
    });
  }
}

/**
 * API for image storage operations
 */
export const imageDB = {
  /**
   * Save an image to IndexedDB
   */
  async saveImage(image: ImageRecord): Promise<void> {
    try {
      // Convert file to base64
      const fileData = await fileToBase64(image.file);

      // Create stored image object
      const storedImage: StoredImage = {
        id: image.id,
        name: image.file.name,
        type: image.file.type,
        fileData,
        width: image.width,
        height: image.height,
        lastModified: image.file.lastModified,
        metadata: image.metadata,
      };

      // Save to IndexedDB
      await imageStore.put(storedImage);
    } catch (error) {
      console.error("Error saving image:", error);
      throw error;
    }
  },

  /**
   * Get all images from IndexedDB
   */
  async getAllImages(): Promise<ImageRecord[]> {
    try {
      const storedImages = await imageStore.getAll();

      // Convert stored images to ImageRecord objects
      return storedImages.map((img) => {
        // Process the base64 data
        const fileData = img.fileData;
        const base64Data = fileData.includes("base64,")
          ? fileData
          : `data:${img.type};base64,${fileData}`;

        // Create a file object
        const file = createFileFromBase64(base64Data, img.name, img.type);

        // Create a blob URL
        const blob = new Blob([file], { type: img.type });
        const url = URL.createObjectURL(blob);

        return {
          id: img.id,
          file,
          url,
          width: img.width,
          height: img.height,
          metadata: img.metadata,
        };
      });
    } catch (error) {
      console.error("Error getting all images:", error);
      return [];
    }
  },

  /**
   * Get an image by ID
   */
  async getImageById(id: string): Promise<ImageRecord | null> {
    try {
      const img = await imageStore.get(id);

      if (!img) {
        return null;
      }

      // Process the base64 data
      const fileData = img.fileData;
      const base64Data = fileData.includes("base64,")
        ? fileData
        : `data:${img.type};base64,${fileData}`;

      // Create a file object
      const file = createFileFromBase64(base64Data, img.name, img.type);

      // Create a blob URL
      const blob = new Blob([file], { type: img.type });
      const url = URL.createObjectURL(blob);

      return {
        id: img.id,
        file,
        url,
        width: img.width,
        height: img.height,
        metadata: img.metadata,
      };
    } catch (error) {
      console.error(`Error getting image ${id}:`, error);
      return null;
    }
  },

  /**
   * Update an existing image
   */
  async updateImage(
    id: string,
    updates: {
      fileData?: string;
      type?: string;
      width?: number;
      height?: number;
      lastModified?: number;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      await imageStore.update(id, updates);
    } catch (error) {
      console.error(`Error updating image ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete an image by ID
   */
  async deleteImage(id: string): Promise<void> {
    try {
      await imageStore.delete(id);
    } catch (error) {
      console.error(`Error deleting image ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete all images
   */
  async deleteAllImages(): Promise<void> {
    try {
      await imageStore.clear();
    } catch (error) {
      console.error("Error deleting all images:", error);
      throw error;
    }
  },
};

export default imageDB;
