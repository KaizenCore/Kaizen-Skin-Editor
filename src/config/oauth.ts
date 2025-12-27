// Kaizen Core OAuth Configuration

export const OAUTH_CONFIG = {
  clientId: import.meta.env.VITE_KAIZEN_CLIENT_ID || '',
  baseUrl: import.meta.env.VITE_KAIZEN_BASE_URL || 'https://kaizencore.tech',
  redirectUri: import.meta.env.VITE_KAIZEN_REDIRECT_URI || 'http://localhost:1420/oauth/callback',

  // OAuth endpoints
  get authorizeUrl() {
    return `${this.baseUrl}/oauth/authorize`;
  },
  get tokenUrl() {
    return `${this.baseUrl}/oauth/token`;
  },
  get apiUrl() {
    return `${this.baseUrl}/api/v1`;
  },

  // Scopes needed for skin editor
  scopes: ['user:read', 'user:profile', 'minecraft:verify', 'skin:read', 'skin:write'],
} as const;
