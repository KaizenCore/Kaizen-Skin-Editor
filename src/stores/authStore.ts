import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  KaizenApi,
  type KaizenUser,
  type KaizenMinecraftProfile,
} from '@/lib/io/KaizenApi';

// Helper to extract minecraft profile from user
function extractMinecraftProfile(user: KaizenUser | null): KaizenMinecraftProfile | null {
  if (!user?.minecraft_username || !user?.minecraft_avatar_url) {
    return null;
  }
  return {
    username: user.minecraft_username,
    avatarUrl: user.minecraft_avatar_url,
  };
}

interface AuthState {
  // State
  user: KaizenUser | null;
  minecraftProfile: KaizenMinecraftProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  login: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    user: null,
    minecraftProfile: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Initialize from stored session
    initialize: () => {
      const { user, isAuthenticated } = KaizenApi.initialize();
      set({
        user,
        isAuthenticated,
        minecraftProfile: extractMinecraftProfile(user),
      });
    },

    // Start OAuth login flow
    login: async () => {
      set({ isLoading: true, error: null });

      try {
        const authUrl = await KaizenApi.getAuthorizationUrl();
        // Open in system browser (or same window for web)
        window.open(authUrl, '_self');
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to start login',
          isLoading: false,
        });
      }
    },

    // Handle OAuth callback
    handleCallback: async (code: string, state: string) => {
      set({ isLoading: true, error: null });

      try {
        // Exchange code for tokens
        await KaizenApi.exchangeCodeForTokens(code, state);

        // Fetch user info
        const user = await KaizenApi.fetchUser();
        console.log('Fetched user:', user);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          minecraftProfile: extractMinecraftProfile(user),
        });
      } catch (error) {
        console.error('Login error:', error);
        set({
          error: error instanceof Error ? error.message : 'Login failed',
          isLoading: false,
        });
      }
    },

    // Logout
    logout: async () => {
      set({ isLoading: true });

      try {
        await KaizenApi.logout();
      } finally {
        set({
          user: null,
          minecraftProfile: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    },

    // Clear error
    clearError: () => set({ error: null }),
  }))
);
