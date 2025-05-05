// src/store/architecture.ts
/**
 * Zustand Architecture Patterns
 *
 * This file demonstrates best practices for structuring larger-scale Zustand applications
 * with proper separation of concerns, slices, and domain-driven approaches.
 */

import { create } from "zustand";
import { persist, subscribeWithSelector, devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Type definitions that would be in your types/ folder
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

// Approach 1: Single Store with Multiple Slices
// =============================================

// First, define the state shape for each slice
interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

interface PhotosSlice {
  photos: Photo[];
  selectedPhotoId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
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

  // Actions
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

// Combine all slices into a single store type
interface StoreState extends AuthSlice, PhotosSlice, EditorSlice {}

// Create the store with all slices
const useStore = create<StoreState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Auth slice
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Photos slice
        photos: [],
        selectedPhotoId: null,

        // Editor slice
        currentTool: null,
        cropSettings: { x: 0, y: 0, width: 0, height: 0 },
        resizeSettings: { width: 0, height: 0, maintainAspectRatio: true },
        filterSettings: { name: "", intensity: 0 },
        blurSettings: { radius: 0, strength: 0 },

        // Auth actions
        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            // Simulate API call
            const user = await mockAuthService.login(email, password);
            set({ user, isAuthenticated: true, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        logout: () => {
          set({ user: null, isAuthenticated: false });
        },

        updateProfile: async (updates) => {
          const { user } = get();
          if (!user) return;

          set({ isLoading: true, error: null });
          try {
            // Simulate API call
            const updatedUser = await mockAuthService.updateProfile(
              user.id,
              updates
            );
            set({ user: updatedUser, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        // Photos actions
        fetchPhotos: async () => {
          set({ isLoading: true, error: null });
          try {
            // Simulate API call
            const photos = await mockPhotoService.getPhotos();
            set({ photos, isLoading: false });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        selectPhoto: (id) => {
          set({ selectedPhotoId: id });
          // Reset editor settings when selecting a new photo
          if (id) {
            const photo = get().photos.find((p) => p.id === id);
            if (photo) {
              set((state) => {
                state.resizeSettings.width = photo.width;
                state.resizeSettings.height = photo.height;
              });
            }
          }
        },

        uploadPhoto: async (file) => {
          set({ isLoading: true, error: null });
          try {
            // Simulate API call
            const newPhoto = await mockPhotoService.uploadPhoto(file);
            set((state) => {
              state.photos.push(newPhoto);
              state.isLoading = false;
            });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        deletePhoto: async (id) => {
          set({ isLoading: true, error: null });
          try {
            // Simulate API call
            await mockPhotoService.deletePhoto(id);
            set((state) => {
              state.photos = state.photos.filter((p) => p.id !== id);
              if (state.selectedPhotoId === id) {
                state.selectedPhotoId = null;
              }
              state.isLoading = false;
            });
          } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
          }
        },

        // Editor actions
        selectTool: (tool) => {
          set({ currentTool: tool });
        },

        updateCropSettings: (settings) => {
          set((state) => {
            Object.assign(state.cropSettings, settings);
          });
        },

        updateResizeSettings: (settings) => {
          set((state) => {
            Object.assign(state.resizeSettings, settings);

            // Maintain aspect ratio if needed
            if (state.resizeSettings.maintainAspectRatio) {
              const photo = state.photos.find(
                (p) => p.id === state.selectedPhotoId
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
          set((state) => {
            Object.assign(state.filterSettings, settings);
          });
        },

        updateBlurSettings: (settings) => {
          set((state) => {
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
            // Determine which settings to use based on the current tool
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

            // Simulate API call
            const updatedPhoto = await mockPhotoService.applyEdit(
              selectedPhotoId,
              currentTool,
              parameters
            );

            // Update the photo in the store
            set((state) => {
              const index = state.photos.findIndex(
                (p) => p.id === selectedPhotoId
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
      })),
      {
        name: "photo-editor-store",
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          photos: state.photos,
        }),
      }
    )
  )
);

// Approach 2: Modular store with separate slices
// ==============================================

// Create separate stores for each slice
const createAuthSlice = (set: any, get: any) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
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
      // Simulate API call
      const updatedUser = await mockAuthService.updateProfile(user.id, updates);
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
});

const createPhotosSlice = (set: any, get: any) => ({
  photos: [],
  selectedPhotoId: null,
  isLoading: false,
  error: null,

  fetchPhotos: async () => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      const photos = await mockPhotoService.getPhotos();
      set({ photos, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectPhoto: (id: string | null) => {
    set({ selectedPhotoId: id });
    // Could access editor slice to reset settings
    if (id) {
      const photo = get().photos.find((p: Photo) => p.id === id);
      if (photo) {
        get().updateResizeSettings({
          width: photo.width,
          height: photo.height,
        });
      }
    }
  },

  uploadPhoto: async (file: File) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      const newPhoto = await mockPhotoService.uploadPhoto(file);
      set((state: any) => {
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
      // Simulate API call
      await mockPhotoService.deletePhoto(id);
      set((state: any) => {
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

const createEditorSlice = (set: any, get: any) => ({
  currentTool: null as "crop" | "resize" | "filter" | "blur" | null,
  cropSettings: { x: 0, y: 0, width: 0, height: 0 },
  resizeSettings: { width: 0, height: 0, maintainAspectRatio: true },
  filterSettings: { name: "", intensity: 0 },
  blurSettings: { radius: 0, strength: 0 },

  selectTool: (tool: "crop" | "resize" | "filter" | "blur" | null) => {
    set({ currentTool: tool });
  },

  updateCropSettings: (
    settings: Partial<{ x: number; y: number; width: number; height: number }>
  ) => {
    set((state: any) => {
      Object.assign(state.cropSettings, settings);
    });
  },

  updateResizeSettings: (
    settings: Partial<{
      width: number;
      height: number;
      maintainAspectRatio: boolean;
    }>
  ) => {
    set((state: any) => {
      Object.assign(state.resizeSettings, settings);

      // Maintain aspect ratio if needed
      if (state.resizeSettings.maintainAspectRatio) {
        const { photos, selectedPhotoId } = get();
        const photo = photos.find((p: Photo) => p.id === selectedPhotoId);

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

  updateFilterSettings: (
    settings: Partial<{ name: string; intensity: number }>
  ) => {
    set((state: any) => {
      Object.assign(state.filterSettings, settings);
    });
  },

  updateBlurSettings: (
    settings: Partial<{ radius: number; strength: number }>
  ) => {
    set((state: any) => {
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
      // Determine which settings to use based on the current tool
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

      // Simulate API call
      const updatedPhoto = await mockPhotoService.applyEdit(
        selectedPhotoId,
        currentTool,
        parameters
      );

      // Update the photo in the store
      set((state: any) => {
        const { photos } = state;
        const index = photos.findIndex((p: Photo) => p.id === selectedPhotoId);
        if (index !== -1) {
          photos[index] = updatedPhoto;
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

// Combine all slices into a single store
interface BoundStore {
  // Auth slice
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;

  // Photos slice
  photos: Photo[];
  selectedPhotoId: string | null;
  fetchPhotos: () => Promise<void>;
  selectPhoto: (id: string | null) => void;
  uploadPhoto: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;

  // Editor slice
  currentTool: "crop" | "resize" | "filter" | "blur" | null;
  cropSettings: { x: number; y: number; width: number; height: number };
  resizeSettings: {
    width: number;
    height: number;
    maintainAspectRatio: boolean;
  };
  filterSettings: { name: string; intensity: number };
  blurSettings: { radius: number; strength: number };
  selectTool: (tool: "crop" | "resize" | "filter" | "blur" | null) => void;
  updateCropSettings: (
    settings: Partial<{ x: number; y: number; width: number; height: number }>
  ) => void;
  updateResizeSettings: (
    settings: Partial<{
      width: number;
      height: number;
      maintainAspectRatio: boolean;
    }>
  ) => void;
  updateFilterSettings: (
    settings: Partial<{ name: string; intensity: number }>
  ) => void;
  updateBlurSettings: (
    settings: Partial<{ radius: number; strength: number }>
  ) => void;
  applyEdit: () => Promise<void>;
  resetSettings: () => void;
}

// Create the modular store
const useModularStore = create<BoundStore>()(
  devtools(
    persist(
      immer((...a) => ({
        ...createAuthSlice(...a),
        ...createPhotosSlice(...a),
        ...createEditorSlice(...a),
      })),
      {
        name: "photo-editor-modular-store",
        partialize: (state) => ({
          // Only persist certain parts of the state
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          photos: state.photos,
        }),
      }
    )
  )
);

// Approach 3: Separate stores with custom hooks
// ============================================

// Create separate stores for each domain
const useAuthStore = create<AuthSlice>()(
  persist(
    immer((set, get) => createAuthSlice(set, get)),
    {
      name: "auth-store",
    }
  )
);

const usePhotosStore = create<PhotosSlice>()(
  persist(
    immer((set, get) => createPhotosSlice(set, get)),
    {
      name: "photos-store",
    }
  )
);

const useEditorStore = create<EditorSlice>()(
  devtools(immer((set, get) => createEditorSlice(set, get)))
);

// Create custom hooks for accessing or combining data from multiple stores
export const useSelectedPhoto = () => {
  const selectedPhotoId = usePhotosStore((state) => state.selectedPhotoId);
  const photos = usePhotosStore((state) => state.photos);

  return photos.find((photo) => photo.id === selectedPhotoId) || null;
};

export const useUserPhotos = () => {
  const user = useAuthStore((state) => state.user);
  const photos = usePhotosStore((state) => state.photos);

  return user ? photos.filter((photo) => photo.ownerId === user.id) : [];
};

export const usePhotoWithEditorState = () => {
  const selectedPhoto = useSelectedPhoto();
  const currentTool = useEditorStore((state) => state.currentTool);
  const cropSettings = useEditorStore((state) => state.cropSettings);
  const resizeSettings = useEditorStore((state) => state.resizeSettings);
  const filterSettings = useEditorStore((state) => state.filterSettings);
  const blurSettings = useEditorStore((state) => state.blurSettings);

  return {
    photo: selectedPhoto,
    editorState: {
      currentTool,
      cropSettings,
      resizeSettings,
      filterSettings,
      blurSettings,
    },
  };
};

// Export all hooks and stores
export {
  // Approach 1: Single store
  useStore,

  // Approach 2: Modular store
  useModularStore,

  // Approach 3: Separate stores
  useAuthStore,
  usePhotosStore,
  useEditorStore,
};

// Mock services for demonstration
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
      width: 1200, // Placeholder
      height: 800, // Placeholder
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
    // Simulate applying an edit
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
