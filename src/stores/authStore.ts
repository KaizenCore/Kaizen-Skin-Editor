import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  KaizenApi,
  type KaizenUser,
  type KaizenMinecraftProfile,
  type KaizenUserBadge,
} from '@/lib/io/KaizenApi';
import { toast } from '@/lib/toast';

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
  badges: KaizenUserBadge[];
  newBadge: KaizenUserBadge | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  initialize: () => void;
  login: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  fetchBadges: () => Promise<void>;
  showNewBadge: (badge: KaizenUserBadge) => void;
  clearNewBadge: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    minecraftProfile: null,
    badges: [],
    newBadge: null,
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

      // Fetch badges if authenticated
      if (isAuthenticated) {
        get().fetchBadges();
      }
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

        // Fetch badges after login
        get().fetchBadges();

        toast.success('Logged in', `Welcome back, ${user.name}!`);
      } catch (error) {
        console.error('Login error:', error);
        const message = error instanceof Error ? error.message : 'Login failed';
        set({
          error: message,
          isLoading: false,
        });
        toast.error('Login failed', message);
      }
    },

    // Logout
    logout: async () => {
      set({ isLoading: true });

      try {
        await KaizenApi.logout();
        toast.success('Logged out', 'See you next time!');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Logout failed';
        toast.error('Logout failed', message);
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

    // Fetch user badges
    fetchBadges: async () => {
      if (!get().isAuthenticated) return;

      try {
        const badges = await KaizenApi.fetchMyBadges();
        set({ badges });
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      }
    },

    // Show new badge notification
    showNewBadge: (badge: KaizenUserBadge) => set({ newBadge: badge }),

    // Clear new badge notification
    clearNewBadge: () => set({ newBadge: null }),
  }))
);
