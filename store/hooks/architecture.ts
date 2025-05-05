// src/store/architecture.ts
/**
 * Zustand Architecture Patterns
 * 
 * This file demonstrates best practices for structuring larger-scale Zustand applications
 * with proper separation of concerns, slices, and domain-driven approaches.
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

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
});dedAt: Date;
  edits: PhotoEdit[];
  ownerId: string;
}

interface PhotoEdit {
  id: string;
  appliedAt: Date;
  type: 'crop' | 'resize' | 'filter' | 'blur';
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
  currentTool: 'crop' | 'resize' | 'filter' | 'blur' | null;
  cropSettings: { x: number; y: number; width: number; height: number };
  resizeSettings: { width: number; height: number; maintainAspectRatio: boolean };
  filterSettings: { name: string; intensity: number };
  blurSettings: { radius: number; strength: number };
  
  // Actions
  selectTool: (tool: EditorSlice['currentTool']) => void;
  updateCropSettings: (settings: Partial<EditorSlice['cropSettings']>) => void;
  updateResizeSettings: (settings: Partial<EditorSlice['resizeSettings']>) => void;
  updateFilterSettings: (settings: Partial<EditorSlice['filterSettings']>) => void;
  updateBlurSettings: (settings: Partial<EditorSlice['blurSettings']>) => void;
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
        filterSettings: { name: '', intensity: 0 },
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
            const updatedUser = await mockAuthService.updateProfile(user.id, updates);
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
            const photo = get().photos.find(p => p.id === id);
            if (photo) {
              set(state => {
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
            set(state => {
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
            set(state => {
              state.photos = state.photos.filter(p => p.id !== id);
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
          set(state => {
            Object.assign(state.cropSettings, settings);
          });
        },
        
        updateResizeSettings: (settings) => {
          set(state => {
            Object.assign(state.resizeSettings, settings);
            
            // Maintain aspect ratio if needed
            if (state.resizeSettings.maintainAspectRatio) {
              const photo = state.photos.find(p => p.id === state.selectedPhotoId);
              if (photo) {
                const aspectRatio = photo.width / photo.height;
                
                if (settings.width && !settings.height) {
                  state.resizeSettings.height = Math.round(settings.width / aspectRatio);
                } else if (settings.height && !settings.width) {
                  state.resizeSettings.width = Math.round(settings.height * aspectRatio);
                }
              }
            }
          });
        },
        
        updateFilterSettings: (settings) => {
          set(state => {
            Object.assign(state.filterSettings, settings);
          });
        },
        
        updateBlurSettings: (settings) => {
          set(state => {
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
                case 'crop': return cropSettings;
                case 'resize': return resizeSettings;
                case 'filter': return filterSettings;
                case 'blur': return blurSettings;
                default: return {};
              }
            })();
            
            // Simulate API call
            const updatedPhoto = await mockPhotoService.applyEdit(
              selectedPhotoId,
              currentTool,
              parameters
            );
            
            // Update the photo in the store
            set(state => {
              const index = state.photos.findIndex(p => p.id === selectedPhotoId);
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
            filterSettings: { name: '', intensity: 0 },
            blurSettings: { radius: 0, strength: 0 },
          });
        },
      })),
      {
        name: 'photo-editor-store',
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
  
  uploa