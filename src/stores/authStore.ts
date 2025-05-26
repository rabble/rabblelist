import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

// Constants
const STORAGE_KEY = 'auth-storage' as const
const DEFAULT_LOADING_STATE = true as const

// Types
interface AuthState {
  user: User | null
  isLoading: boolean
}

interface AuthActions {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

type AuthStore = AuthState & AuthActions

// Initial state factory
const createInitialState = (): AuthState => ({
  user: null,
  isLoading: DEFAULT_LOADING_STATE,
})

// Action creators
const createAuthActions = (
  set: (state: Partial<AuthState>) => void
): AuthActions => ({
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set(createInitialState()),
})

// Persistence configuration
const persistConfig = {
  name: STORAGE_KEY,
  partialize: (state: AuthStore): Pick<AuthState, 'user'> => ({
    user: state.user,
  }),
}

// Main store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...createInitialState(),
      ...createAuthActions(set),
    }),
    persistConfig
  )
)

// Selectors for better performance and cleaner components
export const selectUser = (state: AuthStore) => state.user
export const selectIsLoading = (state: AuthStore) => state.isLoading
export const selectIsAuthenticated = (state: AuthStore) => state.user !== null