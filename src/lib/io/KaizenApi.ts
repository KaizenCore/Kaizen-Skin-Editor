import { OAUTH_CONFIG } from '@/config/oauth';

// User types from Kaizen API
export interface KaizenTag {
  slug: string;
  name: string;
  type: string;
  icon?: string;
  color?: string;
}

export interface KaizenUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
  avatar_url?: string;
  minecraft_username?: string | null;
  minecraft_avatar_url?: string | null;
  tags?: KaizenTag[];
  is_patron?: boolean;
  locale?: string;
}

export interface KaizenMinecraftProfile {
  username: string;
  avatarUrl: string;
}

// Badge types
export interface KaizenBadge {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'achievement' | 'milestone' | 'special';
  requirement_count?: number;
}

export interface KaizenUserBadge extends KaizenBadge {
  earned_at: string;
}

export interface KaizenBadgeWithStatus extends KaizenBadge {
  is_earned: boolean;
}

export interface KaizenTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// PKCE utilities
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Storage keys
const STORAGE_KEYS = {
  CODE_VERIFIER: 'kaizen_code_verifier',
  STATE: 'kaizen_oauth_state',
  ACCESS_TOKEN: 'kaizen_access_token',
  REFRESH_TOKEN: 'kaizen_refresh_token',
  TOKEN_EXPIRY: 'kaizen_token_expiry',
  USER: 'kaizen_user',
} as const;

export class KaizenApi {
  private static accessToken: string | null = null;

  /** Initialize from stored tokens */
  static initialize(): { user: KaizenUser | null; isAuthenticated: boolean } {
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      if (Date.now() < expiry) {
        this.accessToken = storedToken;
        const user = storedUser ? JSON.parse(storedUser) : null;
        return { user, isAuthenticated: true };
      } else {
        // Token expired, clear storage
        this.clearStorage();
      }
    }

    return { user: null, isAuthenticated: false };
  }

  /** Generate PKCE challenge and authorization URL */
  static async getAuthorizationUrl(): Promise<string> {
    // Generate PKCE code verifier (128 characters)
    const codeVerifier = generateRandomString(128);
    const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

    // Generate state for CSRF protection
    const state = generateRandomString(32);

    // Store for later use
    sessionStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);
    sessionStorage.setItem(STORAGE_KEYS.STATE, state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: OAUTH_CONFIG.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
  }

  /** Exchange authorization code for tokens */
  static async exchangeCodeForTokens(code: string, state: string): Promise<KaizenTokens> {
    // Verify state
    const storedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
    if (state !== storedState) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Get code verifier
    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);
    if (!codeVerifier) {
      throw new Error('Missing code verifier - please restart login');
    }

    // Exchange code for tokens
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: OAUTH_CONFIG.clientId,
        code,
        redirect_uri: OAUTH_CONFIG.redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Token exchange failed' }));
      throw new Error(error.message || `Token exchange failed: ${response.status}`);
    }

    const tokens: KaizenTokens = await response.json();

    // Store tokens
    this.accessToken = tokens.access_token;
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    }
    localStorage.setItem(
      STORAGE_KEYS.TOKEN_EXPIRY,
      String(Date.now() + tokens.expires_in * 1000)
    );

    // Clear session storage
    sessionStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);

    return tokens;
  }

  /** Fetch current user info (uses /user/profile to get full profile with Minecraft) */
  static async fetchUser(): Promise<KaizenUser> {
    const response = await this.authenticatedFetch(`${OAUTH_CONFIG.apiUrl}/user/profile`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const json = await response.json();
    // API returns { data: {...} } wrapper
    const user: KaizenUser = json.data || json;

    // Cache user
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    return user;
  }

  /** Logout and clear tokens */
  static async logout(): Promise<void> {
    // Revoke token on server
    if (this.accessToken) {
      try {
        await this.authenticatedFetch(`${OAUTH_CONFIG.apiUrl}/token`, {
          method: 'DELETE',
        });
      } catch {
        // Ignore errors during logout
      }
    }

    this.clearStorage();
  }

  /** Check if user is authenticated */
  static isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /** Get current access token */
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  // Badge API methods

  /** Fetch all available badges */
  static async fetchAllBadges(): Promise<KaizenBadge[]> {
    const response = await fetch(`${OAUTH_CONFIG.apiUrl}/badges`);
    if (!response.ok) {
      throw new Error(`Failed to fetch badges: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  }

  /** Fetch authenticated user's earned badges */
  static async fetchMyBadges(): Promise<KaizenUserBadge[]> {
    const response = await this.authenticatedFetch(`${OAUTH_CONFIG.apiUrl}/my/badges`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user badges: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  }

  /** Fetch all badges with earned status for authenticated user */
  static async fetchMyBadgesWithStatus(): Promise<KaizenBadgeWithStatus[]> {
    const response = await this.authenticatedFetch(`${OAUTH_CONFIG.apiUrl}/my/badges/all`);
    if (!response.ok) {
      throw new Error(`Failed to fetch badges with status: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  }

  /** Fetch badges for a specific user (public) */
  static async fetchUserBadges(userId: number): Promise<KaizenUserBadge[]> {
    const response = await fetch(`${OAUTH_CONFIG.apiUrl}/users/${userId}/badges`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user badges: ${response.status}`);
    }
    const json = await response.json();
    return json.data || json;
  }

  // Private helpers

  private static async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }

  private static clearStorage(): void {
    this.accessToken = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}
