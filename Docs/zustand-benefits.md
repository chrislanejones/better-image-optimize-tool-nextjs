// Benefits of Using Zustand for the Image Editor

/**
 * This document outlines the key benefits and advantages we gained by
 * refactoring our Image Editor application from React Context to Zustand.
 */

// 1. Simplified State Management
// ==============================

// BEFORE with React Context:
const ImageEditorContext = createContext();

export const ImageEditorProvider = ({ children }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isBlurring, setIsBlurring] = useState(false);
  // ... many more states
  
  // Many handler functions
  const handleImageSelect = (image) => { /* ... */ };
  const handleCrop = (crop) => { /* ... */ };
  // ... many more handlers
  
  return (
    <ImageEditorContext.Provider value={{
      images, selectedImage, isEditing, isCropping, isBlurring,
      handleImageSelect, handleCrop,
      // ... many more values and functions
    }}>
      {children}
    </ImageEditorContext.Provider>
  );
};

// AFTER with Zustand:
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useImageStore = create(immer((set) => ({
  images: [],
  selectedImage: null,
  isEditing: false,
  isCropping: false,
  isBlurring: false,
  
  // Actions are defined in-place with the state
  selectImage: (image) => set({ selectedImage: image }),
  toggleCropping: () => set((state) => {
    state.isCropping = !state.isCropping;
    if (state.isCropping) {
      state.isBlurring = false;
      state.isPainting = false;
    }
  }),
  // ... more actions
})));

// 2. No Provider Wrapper Hell
// ==========================

// BEFORE with React Context:
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <ImageEditorProvider>
            <NotificationsProvider>
              <MainApp />
            </NotificationsProvider>
          </ImageEditorProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// AFTER with Zustand:
function App() {
  return <MainApp />;
}

// 3. Better Performance Through Selective Re-rendering
// ==================================================

// BEFORE with React Context:
// Every component consuming the context re-renders when ANY value in the context changes
function ImageList() {
  const { images, selectedImage, handleImageSelect } = useContext(ImageEditorContext);
  // Will re-render even when isBlurring changes, which it doesn't care about
  
  return (
    <div>
      {images.map(image => (
        <Image
          key={image.id}
          image={image}
          isSelected={selectedImage?.id === image.id}
          onSelect={() => handleImageSelect(image)}
        />
      ))}
    </div>
  );
}

// AFTER with Zustand:
// Components only re-render when the specific state they consume changes
function ImageList() {
  // Only subscribes to images and selectedImage.id, not the entire store
  const images = useImageStore(state => state.images);
  const selectedImageId = useImageStore(state => state.selectedImage?.id);
  const selectImage = useImageStore(state => state.selectImage);
  
  return (
    <div>
      {images.map(image => (
        <Image
          key={image.id}
          image={image}
          isSelected={selectedImageId === image.id}
          onSelect={() => selectImage(image)}
        />
      ))}
    </div>
  );
}

// 4. Built-in Persistence
// =====================

// BEFORE with React Context:
// Had to manually implement localStorage persistence
useEffect(() => {
  // Load from localStorage on mount
  const savedImages = localStorage.getItem('images');
  if (savedImages) {
    setImages(JSON.parse(savedImages));
  }
}, []);

useEffect(() => {
  // Save to localStorage whenever images change
  localStorage.setItem('images', JSON.stringify(images));
}, [images]);

// AFTER with Zustand:
// Built-in persistence with the persist middleware
import { persist } from 'zustand/middleware';

export const useImageStore = create(
  persist(
    (set) => ({
      // ... state and actions
    }),
    {
      name: 'image-editor-storage',
      partialize: (state) => ({ 
        images: state.images,
        // Only persist what we need
      }),
    }
  )
);

// 5. Easier Debugging
// =================

// BEFORE with React Context:
// Debugging required manual logging or React DevTools
console.log('Context values:', { images, selectedImage, isEditing });

// AFTER with Zustand:
// Built-in Redux DevTools integration with the devtools middleware
import { devtools } from 'zustand/middleware';

export const useImageStore = create(
  devtools(
    (set) => ({
      // ... state and actions
    })
  )
);
// Now you can use Redux DevTools to see all state changes, actions, and time-travel debug

// 6. Simplified Testing
// ==================

// BEFORE with React Context:
// Had to wrap components in providers for testing
test('selecting an image works', () => {
  render(
    <ImageEditorProvider>
      <ImageList />
    </ImageEditorProvider>
  );
  // ... test code
});

// AFTER with Zustand:
// Can interact with the store directly in tests
test('selecting an image works', () => {
  // Reset the store before the test
  useImageStore.setState({ images: [], selectedImage: null });
  
  // Add test data
  useImageStore.setState({ 
    images: [{ id: '1', url: 'test.jpg' }] 
  });
  
  // Call actions directly
  useImageStore.getState().selectImage({ id: '1', url: 'test.jpg' });
  
  // Assert on store state
  expect(useImageStore.getState().selectedImage.id).toBe('1');
  
  // Now render component with store already set up
  render(<ImageList />);
  // ... more UI testing
});

// 7. Better TypeScript Integration
// =============================

// BEFORE with React Context:
// Type safety was harder to enforce with context
interface ImageEditorContextType {
  images: Image[];
  selectedImage: Image | null;
  // ... many more types
  handleImageSelect: (image: Image) => void;
  // ... many more handlers
}

const ImageEditorContext = createContext<ImageEditorContextType | undefined>(undefined);

function useImageEditor() {
  const context = useContext(ImageEditorContext);
  if (context === undefined) {
    throw new Error('useImageEditor must be used within an ImageEditorProvider');
  }
  return context;
}

// AFTER with Zustand:
// Type safety is built-in
interface ImageState {
  images: Image[];
  selectedImage: Image | null;
  // ... more state properties
  
  // Actions are part of the type
  selectImage: (image: Image) => void;
  // ... more actions
}

const useImageStore = create<ImageState>((set) => ({
  // Types are checked automatically
  images: [],
  selectedImage: null,
  
  selectImage: (image) => set({ selectedImage: image }),
  // ... more actions
}));

// 8. Modular State Organization
// ===========================

// BEFORE with React Context:
// All state and logic was in one big provider
const ImageEditorProvider = ({ children }) => {
  // Dozens of states and functions all in one place
  // ...

  return (
    <ImageEditorContext.Provider value={{
      // Passing dozens of values down
    }}>
      {children}
    </ImageEditorContext.Provider>
  );
};

// AFTER with Zustand:
// State can be split into logical slices
const createImagesSlice = (set, get) => ({
  images: [],
  selectedImage: null,
  selectImage: (image) => set({ selectedImage: image }),
  // ... more related to images
});

const createEditingSlice = (set, get) => ({
  isBlurring: false,
  isCropping: false,
  toggleBlurring: () => set((state) => {
    state.isBlurring = !state.isBlurring;
    if (state.isBlurring) {
      state.isCropping = false;
    }
  }),
  // ... more related to editing
});

// Combine slices into one store
const useImageStore = create((set, get) => ({
  ...createImagesSlice(set, get),
  ...createEditingSlice(set, get),
  // ... more slices
}));

// Or even create separate stores
const useImagesStore = create(createImagesSlice);
const useEditingStore = create(createEditingSlice);

// 9. Custom Hooks for Focused Logic
// ==============================

// BEFORE with React Context:
// Had to use the entire context, even when only needing a small part
function BlurControls() {
  const { 
    isBlurring, toggleBlurring, blurAmount, 
    setBlurAmount, blurRadius, setBlurRadius,
    // ... and everything else in the context
  } = useImageEditor();
  
  // ... component code
}

// AFTER with Zustand:
// Can create custom hooks for specific use cases
function useBlurControls() {
  const isBlurring = useImageStore(state => state.isBlurring);
  const toggleBlurring = useImageStore(state => state.toggleBlurring);
  const blurAmount = useImageStore(state => state.blurAmount);
  const setBlurAmount = useImageStore(state => state.setBlurAmount);
  const blurRadius = useImageStore(state => state.blurRadius);
  const setBlurRadius = useImageStore(state => state.setBlurRadius);
  
  return {
    isBlurring,
    toggleBlurring,
    blurAmount,
    setBlurAmount,
    blurRadius,
    setBlurRadius,
  };
}

function BlurControls() {
  const { 
    isBlurring, toggleBlurring, blurAmount, 
    setBlurAmount, blurRadius, setBlurRadius 
  } = useBlurControls();
  
  // ... component code
}

// 10. Immer Integration for Easier Updates
// =====================================

// BEFORE with React Context:
// Had to manually handle immutable updates
setImages(prevImages => {
  return prevImages.map(img => 
    img.id === updatedImage.id ? { ...img, ...updatedImage } : img
  );
});

// AFTER with Zustand + Immer:
// Can use mutable syntax for updates
useImageStore.setState(state => {
  const imageIndex = state.images.findIndex(img => img.id === updatedImage.id);
  if (imageIndex !== -1) {
    // Direct mutation is OK with Immer
    state.images[imageIndex] = { ...state.images[imageIndex], ...updatedImage };
  }
});

// OR with a defined action:
toggleEditMode: () => set(state => {
  // Can directly mutate with immer
  state.isEditMode = !state.isEditMode;
  
  // If entering edit mode, reset these states
  if (state.isEditMode) {
    state.isBlurring = false;
    state.isCropping = false;
    state.isPainting = false;
  }
});

/**
 * CONCLUSION:
 * 
 * Refactoring our Image Editor from React Context to Zustand has resulted in:
 * 
 * 1. Cleaner, more maintainable code
 * 2. Better performance through selective re-rendering
 * 3. Improved developer experience with DevTools integration
 * 4. Built-in persistence without manual implementation
 * 5. Better testability
 * 6. Stronger type safety with TypeScript
 * 7. More modular state organization
 * 8. Easier immutable state updates via Immer
 * 9. No provider hell in component tree
 * 10. More flexible access to state across the application
 */
