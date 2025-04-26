"use client";

interface StoredImage {
  id: string;
  name: string;
  type: string;
  fileData: string; // base64 encoded file data
  url: string;
  width?: number;
  height?: number;
  lastModified?: number;
}

const DB_NAME = "ImageEditorDB";
const DB_VERSION = 1;
const STORE_NAME = "images";

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open database"));

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
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

// Save an image to IndexedDB
export const saveImage = async (image: StoredImage): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(image);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to save image"));

      // Close the database when transaction completes
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error saving image to IndexedDB:", error);
    throw error;
  }
};

// Update an existing image
export const updateImage = async (
  id: string,
  updates: Partial<StoredImage>
): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      // First get the existing image
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const image = getRequest.result;
        if (!image) {
          reject(new Error("Image not found"));
          return;
        }

        // Update with new data
        const updatedImage = { ...image, ...updates };

        // Put it back in the store
        const putRequest = store.put(updatedImage);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error("Failed to update image"));
      };

      getRequest.onerror = () =>
        reject(new Error("Failed to retrieve image for update"));

      // Close the database when transaction completes
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error updating image in IndexedDB:", error);
    throw error;
  }
};

// Get all images from IndexedDB
export const getAllImages = async (): Promise<StoredImage[]> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error("Failed to get images"));

      // Close the database when transaction completes
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error getting images from IndexedDB:", error);
    return [];
  }
};

// Modified function with better error handling
export const getImageById = async (id: string): Promise<StoredImage | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        console.log("Retrieved image data:", {
          id: result?.id,
          name: result?.name,
          type: result?.type,
          hasFileData: !!result?.fileData,
          fileDataLength: result?.fileData?.length || 0,
        });
        resolve(request.result || null);
      };

      request.onerror = (error) => {
        console.error("Failed to get image:", error);
        reject(new Error("Failed to get image"));
      };

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error getting image from IndexedDB:", error);
    return null;
  }
};

// Delete an image by ID
export const deleteImage = async (id: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete image"));

      // Close the database when transaction completes
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error deleting image from IndexedDB:", error);
    throw error;
  }
};

// Delete all images
export const deleteAllImages = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete all images"));

      // Close the database when transaction completes
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("Error deleting all images from IndexedDB:", error);
    throw error;
  }
};

// Helper function to convert File to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to convert base64 to Blob
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

// Helper function to create a File from base64 data
export const createFileFromBase64 = (
  base64Data: string,
  fileName: string,
  fileType: string
): File => {
  try {
    // Check if base64Data is properly formatted
    if (!base64Data) {
      console.error("Base64 data is empty or undefined");
      throw new Error("Invalid base64 data");
    }

    // Ensure base64 data has the correct prefix
    let processedBase64 = base64Data;
    if (!base64Data.includes("base64,")) {
      console.log("Adding base64 prefix to data");
      processedBase64 = `data:${fileType};base64,${base64Data}`;
    }

    // Create blob from base64
    const blob = base64ToBlob(processedBase64, fileType);

    // Check if blob was created successfully
    if (!blob || blob.size === 0) {
      console.error("Failed to create blob from base64 data");
      throw new Error("Failed to create blob");
    }

    // Create file from blob
    return new File([blob], fileName, { type: fileType });
  } catch (error) {
    console.error("Error creating file from base64:", error);
    // Return a placeholder file to prevent application crashes
    return new File([new Blob([""], { type: "text/plain" })], "error.txt", {
      type: "text/plain",
    });
  }
};
