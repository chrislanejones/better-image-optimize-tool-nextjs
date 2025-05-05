// src/store/architecture.ts

import { create } from "zustand";
import { persist, subscribeWithSelector, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isAdmin: boolean;
}

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  tags: string[];
  uploadedAt: Date;
  edits: PhotoEdit[];
  ownerId: string;
}

interface PhotoEdit {
  id: string;
  appliedAt: Date;
  type: "crop" | "resize" | "filter" | "blur";
  parameters: Record<string, unknown>;
}

// Slice Types
interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

interface PhotosSlice {
  photos: Photo[];
  selectedPhotoId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchPhotos: () => Promise<void>;
  selectPhoto: (id: string | null) => void;
  uploadPhoto: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

interface EditorSlice {
  currentTool: "crop" | "resize" | "filter" | "blur" | null;
  cropSettings: { x: number; y: number; width: number; height: number };
  resizeSettings: {
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  filterSettings: { name: string; intensity: number };
  blurSettings: { radius: number; strength: number };
  selectTool: (tool: EditorSlice["currentTool"]) => void;
  updateCropSettings: (settings: Partial<EditorSlice["cropSettings"]>) => void;
  updateResizeSettings: (
    settings: Partial<EditorSlice["resizeSettings"]>
  ) => void;
  updateFilterSettings: (
    settings: Partial<EditorSlice["filterSettings"]>
  ) => void;
  updateBlurSettings: (settings: Partial<EditorSlice["blurSettings"]>) => void;
  applyEdit: () => Promise<void>;
  resetSettings: () => void;
}

// Combined store type
type StoreState = AuthSlice & PhotosSlice & EditorSlice;

// Slice creators
const createAuthSlice = (set: any, get: any): AuthSlice => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await mockAuthService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const updatedUser = await mockAuthService.updateProfile(user.id, updates);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
});

const createPhotosSlice = (set: any, get: any): PhotosSlice => ({
  photos: [],
  selectedPhotoId: null,
  isLoading: false,
  error: null,

  fetchPhotos: async () => {
    set({ isLoading: true, error: null });
    try {
      const photos = await mockPhotoService.getPhotos();
      set({ photos, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectPhoto: (id: string | null) => {
    set({ selectedPhotoId: id });
    if (id) {
      const photo = get().photos.find((p: Photo) => p.id === id);
      if (photo) {
        set((state: StoreState) => {
          state.resizeSettings.width = photo.width;
          state.resizeSettings.height = photo.height;
        });
      }
    }
  },

  uploadPhoto: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      const newPhoto = await mockPhotoService.uploadPhoto(file);
      set((state: StoreState) => {
        state.photos.push(newPhoto);
        state.isLoading = false;
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deletePhoto: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await mockPhotoService.deletePhoto(id);
      set((state: StoreState) => {
        state.photos = state.photos.filter((p: Photo) => p.id !== id);
        if (state.selectedPhotoId === id) {
          state.selectedPhotoId = null;
        }
        state.isLoading = false;
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
});

const createEditorSlice = (set: any, get: any): EditorSlice => ({
  currentTool: null,
  cropSettings: { x: 0, y: 0, width: 0, height: 0 },
  resizeSettings: { width: 0, height: 0, maintainAspectRatio: true },
  filterSettings: { name: "", intensity: 0 },
  blurSettings: { radius: 0, strength: 0 },

  selectTool: (tool) => {
    set({ currentTool: tool });
  },

  updateCropSettings: (settings) => {
    set((state: StoreState) => {
      Object.assign(state.cropSettings, settings);
    });
  },

  updateResizeSettings: (settings) => {
    set((state: StoreState) => {
      Object.assign(state.resizeSettings, settings);

      if (state.resizeSettings.maintainAspectRatio) {
        const photo = state.photos.find(
          (p: Photo) => p.id === state.selectedPhotoId
        );
        if (photo) {
          const aspectRatio = photo.width / photo.height;

          if (settings.width && !settings.height) {
            state.resizeSettings.height = Math.round(
              settings.width / aspectRatio
            );
          } else if (settings.height && !settings.width) {
            state.resizeSettings.width = Math.round(
              settings.height * aspectRatio
            );
          }
        }
      }
    });
  },

  updateFilterSettings: (settings) => {
    set((state: StoreState) => {
      Object.assign(state.filterSettings, settings);
    });
  },

  updateBlurSettings: (settings) => {
    set((state: StoreState) => {
      Object.assign(state.blurSettings, settings);
    });
  },

  applyEdit: async () => {
    const {
      selectedPhotoId,
      currentTool,
      cropSettings,
      resizeSettings,
      filterSettings,
      blurSettings,
    } = get();

    if (!selectedPhotoId || !currentTool) return;

    set({ isLoading: true, error: null });
    try {
      const parameters = (() => {
        switch (currentTool) {
          case "crop":
            return cropSettings;
          case "resize":
            return resizeSettings;
          case "filter":
            return filterSettings;
          case "blur":
            return blurSettings;
          default:
            return {};
        }
      })();

      const updatedPhoto = await mockPhotoService.applyEdit(
        selectedPhotoId,
        currentTool,
        parameters
      );

      set((state: StoreState) => {
        const index = state.photos.findIndex(
          (p: Photo) => p.id === selectedPhotoId
        );
        if (index !== -1) {
          state.photos[index] = updatedPhoto;
        }
        state.isLoading = false;
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetSettings: () => {
    set({
      cropSettings: { x: 0, y: 0, width: 0, height: 0 },
      resizeSettings: { width: 0, height: 0, maintainAspectRatio: true },
      filterSettings: { name: "", intensity: 0 },
      blurSettings: { radius: 0, strength: 0 },
    });
  },
});

// Create the store
const useStore = create<StoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...createAuthSlice(set, get),
        ...createPhotosSlice(set, get),
        ...createEditorSlice(set, get),
      })),
      {
        name: "photo-editor-store",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          photos: state.photos,
        }),
      }
    )
  )
);

// Mock services
const mockAuthService = {
  login: async (email: string, password: string): Promise<User> => {
    return {
      id: "1",
      name: "John Doe",
      email,
      isAdmin: false,
    };
  },

  updateProfile: async (id: string, updates: Partial<User>): Promise<User> => {
    return {
      id,
      name: updates.name || "John Doe",
      email: updates.email || "john@example.com",
      isAdmin: updates.isAdmin ?? false,
    };
  },
};

const mockPhotoService = {
  getPhotos: async (): Promise<Photo[]> => {
    return [
      {
        id: "1",
        url: "https://example.com/photo1.jpg",
        thumbnail: "https://example.com/photo1-thumb.jpg",
        width: 1200,
        height: 800,
        tags: ["nature", "landscape"],
        uploadedAt: new Date(),
        edits: [],
        ownerId: "1",
      },
    ];
  },

  uploadPhoto: async (file: File): Promise<Photo> => {
    return {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      thumbnail: URL.createObjectURL(file),
      width: 1200,
      height: 800,
      tags: [],
      uploadedAt: new Date(),
      edits: [],
      ownerId: "1",
    };
  },

  deletePhoto: async (id: string): Promise<void> => {
    // Simulate deletion
  },

  applyEdit: async (
    photoId: string,
    editType: "crop" | "resize" | "filter" | "blur",
    parameters: Record<string, unknown>
  ): Promise<Photo> => {
    return {
      id: photoId,
      url: "https://example.com/photo-edited.jpg",
      thumbnail: "https://example.com/photo-edited-thumb.jpg",
      width: 1200,
      height: 800,
      tags: ["nature", "landscape", "edited"],
      uploadedAt: new Date(),
      edits: [
        {
          id: Date.now().toString(),
          appliedAt: new Date(),
          type: editType,
          parameters,
        },
      ],
      ownerId: "1",
    };
  },
};

export { useStore };
