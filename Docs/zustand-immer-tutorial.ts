// Zustand with Immer Tutorial
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, subscribeWithSelector, devtools } from 'zustand/middleware';

/**
 * This file demonstrates how to use Zustand with Immer to manage state
 * in a React application. We'll create a image editor store with middleware.
 * 
 * Benefits of Zustand over Context API:
 * 1. Simpler API - no need for providers
 * 2. Built-in state persistence
 * 3. Middleware support (immer, devtools, etc.)
 * 4. Better performance (only re-renders components that use changed state)
 * 5. DevTools integration
 */

// 1. Simple store without middleware
const useBasicStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// 2. Store with immer middleware for mutable updates
const useImmerStore = create(immer((set) => ({
  user: { name: 'John', age: 30 },
  updateName: (name) => set((state) => {
    // With immer, we can modify state directly
    state.user.name = name;
  }),
  updateAge: (age) => set((state) => {
    state.user.age = age;
  }),
})));

// 3. Store with persistence middleware
const usePersistStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
    }),
    {
      name: 'theme-storage', // unique name for localStorage key
      getStorage: () => localStorage, // or sessionStorage
      partialize: (state) => ({ theme: state.theme }), // only persist these fields
    }
  )
);

// 4. Full-featured store with all middleware
const useCompleteStore = create(
  devtools( // Enables Redux DevTools
    persist( // Enables persistence
      immer( // Enables Immer
        subscribeWithSelector( // Enables selectors with subscribe
          (set, get) => ({
            counter: 0,
            user: { name: '', email: '' },
            todos: [],
            
            // Counter actions
            increment: () => set((state) => { state.counter += 1 }),
            decrement: () => set((state) => { state.counter -= 1 }),
            
            // User actions
            setUser: (name, email) => set((state) => {
              state.user.name = name;
              state.user.email = email;
            }),
            
            // Todo actions
            addTodo: (text) => set((state) => {
              state.todos.push({ id: Date.now(), text, completed: false });
            }),
            toggleTodo: (id) => set((state) => {
              const todo = state.todos.find(t => t.id === id);
              if (todo) todo.completed = !todo.completed;
            }),
            removeTodo: (id) => set((state) => {
              state.todos = state.todos.filter(t => t.id !== id);
            }),
            
            // Complex action using get()
            incrementIfPositive: () => {
              // Access current state using get()
              const currentCount = get().counter;
              if (currentCount > 0) {
                set((state) => { state.counter += 1 });
              }
            }
          })
        )
      ),
      {
        name: 'app-storage',
        partialize: (state) => ({ 
          user: state.user,
          todos: state.todos,
        }),
      }
    )
  )
);

// 5. Best practices for using Zustand in a component

// BAD: This will cause rerenders on every state change
const BadComponent = () => {
  const store = useCompleteStore(); // Gets entire store!
  return <div>{store.counter}</div>;
};

// GOOD: This will only rerender when counter changes
const GoodComponent = () => {
  const counter = useCompleteStore((state) => state.counter);
  const increment = useCompleteStore((state) => state.increment);
  return (
    <div>
      <p>Counter: {counter}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

// BETTER: Use multiple selectors for complex state
const BetterComponent = () => {
  const counter = useCompleteStore((state) => state.counter);
  const user = useCompleteStore((state) => state.user);
  const { increment, setUser } = useCompleteStore((state) => ({
    increment: state.increment,
    setUser: state.setUser,
  }));
  
  return (
    <div>
      <p>Counter: {counter}</p>
      <p>User: {user.name}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={() => setUser('Jane', 'jane@example.com')}>
        Set User
      </button>
    </div>
  );
};

// BEST: Create custom hooks for specific slices of state
const useCounter = () => useCompleteStore((state) => ({
  counter: state.counter,
  increment: state.increment,
  decrement: state.decrement,
}));

const useUser = () => useCompleteStore((state) => ({
  user: state.user,
  setUser: state.setUser,
}));

const BestComponent = () => {
  const { counter, increment } = useCounter();
  const { user, setUser } = useUser();
  
  return (
    <div>
      <p>Counter: {counter}</p>
      <p>User: {user.name}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={() => setUser('Jane', 'jane@example.com')}>
        Set User
      </button>
    </div>
  );
};

// 6. Advanced: Derived state (computed values)
const useDerivedState = () => {
  const todos = useCompleteStore((state) => state.todos);
  
  // Derived values that will only recalculate when todos change
  const completedCount = todos.filter(todo => todo.completed).length;
  const pendingCount = todos.length - completedCount;
  const isAllCompleted = todos.length > 0 && completedCount === todos.length;
  
  return {
    completedCount,
    pendingCount,
    isAllCompleted,
  };
};

// 7. TypeScript support
type State = {
  counter: number;
  user: { name: string; email: string };
  todos: Array<{ id: number; text: string; completed: boolean }>;
  
  increment: () => void;
  decrement: () => void;
  setUser: (name: string, email: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: number) => void;
  removeTodo: (id: number) => void;
};

// Create a typed store
const useTypedStore = create<State>()(
  immer((set) => ({
    counter: 0,
    user: { name: '', email: '' },
    todos: [],
    
    increment: () => set((state) => { state.counter += 1 }),
    decrement: () => set((state) => { state.counter -= 1 }),
    setUser: (name, email) => set((state) => {
      state.user.name = name;
      state.user.email = email;
    }),
    addTodo: (text) => set((state) => {
      state.todos.push({ id: Date.now(), text, completed: false });
    }),
    toggleTodo: (id) => set((state) => {
      const todo = state.todos.find(t => t.id === id);
      if (todo) todo.completed = !todo.completed;
    }),
    removeTodo: (id) => set((state) => {
      state.todos = state.todos.filter(t => t.id !== id);
    }),
  }))
);

/**
 * Migration from React Context to Zustand
 * 
 * 1. Context + useReducer:
 */

// OLD APPROACH WITH CONTEXT:
/*
// Step 1: Create context and reducer
interface State { count: number }
interface Action { type: 'increment' | 'decrement' | 'reset' }

const CounterContext = createContext<{ 
  state: State; 
  dispatch: Dispatch<Action>; 
} | undefined>(undefined);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'increment': return { count: state.count + 1 };
    case 'decrement': return { count: state.count - 1 };
    case 'reset': return { count: 0 };
    default: return state;
  }
};

// Step 2: Create provider
export const CounterProvider: FC = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { count: 0 });
  return (
    <CounterContext.Provider value={{ state, dispatch }}>
      {children}
    </CounterContext.Provider>
  );
};

// Step 3: Create hook for consumers
export const useCounter = () => {
  const context = useContext(CounterContext);
  if (!context) throw new Error('useCounter must be used within CounterProvider');
  return context;
};

// Step 4: Use in components
const CounterComponent = () => {
  const { state, dispatch } = useCounter();
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
    </div>
  );
};
*/

// NEW APPROACH WITH ZUSTAND:
// Step 1: Create store
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));

// Step 2: Use in components (no provider needed!)
const CounterComponent = () => {
  const { count, increment, decrement, reset } = useCounterStore();
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

/**
 * Main advantages of Zustand over Context API:
 * 
 * 1. No Provider Hell - No need to wrap components in providers
 * 2. Single source of truth - State is stored in one place
 * 3. More efficient re-renders - Only components that use changed state re-render
 * 4. Built-in middleware - For persistence, immer, devtools, etc.
 * 5. Simpler API - Less boilerplate code
 * 6. Better TypeScript support - Type inference works better
 * 7. DevTools integration - Can inspect state changes in Redux DevTools
 */

export {
  useBasicStore,
  useImmerStore,
  usePersistStore,
  useCompleteStore,
  useCounter,
  useUser,
  useDerivedState,
  useTypedStore,
  useCounterStore,
};
