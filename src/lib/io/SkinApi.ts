import { KaizenApi } from './KaizenApi';

// API Configuration
const SKIN_API_URL = import.meta.env.VITE_SKIN_API_URL || 'http://localhost:8000/api/v1';

// Types
export type SkinVisibility = 'public' | 'private' | 'unlisted';

export interface SkinCategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  skins_count?: number;
}

export interface Skin {
  id: string;
  name: string;
  description: string | null;
  visibility: SkinVisibility;
  user_id: number;
  is_owner: boolean;
  downloads_count: number;
  likes_count: number;
  is_liked: boolean | null;
  has_share_link: boolean;
  share_url: string | null;
  tags: string[];
  categories: SkinCategory[];
  download_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSkinData {
  name: string;
  description?: string;
  skin_data: string; // Base64 PNG
  visibility?: SkinVisibility;
  tags?: string[];
  category_ids?: number[];
}

export interface UpdateSkinData {
  name?: string;
  description?: string;
  skin_data?: string;
  visibility?: SkinVisibility;
  tags?: string[];
  category_ids?: number[];
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface GalleryFilters {
  category?: string;
  tags?: string[];
  sort?: 'recent' | 'popular' | 'downloads';
  page?: number;
}

export interface ApiError {
  message: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/** API response wrapper */
interface ApiResponse<T> {
  message?: string;
  data: T;
}

class SkinApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'SkinApiError';
  }
}

export class SkinApi {
  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /** Extract data from API response wrapper { message?, data } */
  private static extractData<T>(response: unknown): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as ApiResponse<T>).data;
    }
    return response as T;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authenticated = false
  ): Promise<T> {
    const url = `${SKIN_API_URL}${endpoint}`;
    const headers: HeadersInit = {
      Accept: 'application/json',
      ...options.headers,
    };

    if (authenticated) {
      const token = KaizenApi.getAccessToken();
      if (!token) {
        throw new SkinApiError('Not authenticated', 401, 'missing_token');
      }
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: `Request failed: ${response.status}`,
      }));

      throw new SkinApiError(
        error.message,
        response.status,
        error.error,
        error.errors
      );
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    return this.extractData<T>(json);
  }

  private static async authRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, options, true);
  }

  // ============================================================================
  // PUBLIC ENDPOINTS (No auth required)
  // ============================================================================

  /** Browse public skins gallery */
  static async getGallery(filters: GalleryFilters = {}): Promise<PaginatedResponse<Skin>> {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', String(filters.page));

    const query = params.toString();
    return this.request(`/gallery${query ? `?${query}` : ''}`);
  }

  /** Get popular skins */
  static async getPopularSkins(): Promise<Skin[]> {
    return this.request('/gallery/popular');
  }

  /** Get recent skins */
  static async getRecentSkins(): Promise<Skin[]> {
    return this.request('/gallery/recent');
  }

  /** Search skins */
  static async searchSkins(query: string): Promise<Skin[]> {
    if (query.length < 2) {
      throw new SkinApiError('Query must be at least 2 characters', 422, 'validation_error');
    }
    return this.request(`/gallery/search?q=${encodeURIComponent(query)}`);
  }

  /** Get all categories */
  static async getCategories(): Promise<SkinCategory[]> {
    return this.request('/categories');
  }

  /** Get skins in a category */
  static async getCategorySkins(slug: string): Promise<Skin[]> {
    return this.request(`/categories/${encodeURIComponent(slug)}`);
  }

  /** Get skin details */
  static async getSkin(id: string): Promise<Skin> {
    return this.request(`/skins/${id}`);
  }

  /** Download skin as blob
   * @param id - Skin ID
   * @param internal - If true, adds X-Kaizen-Internal header to prevent download count increment
   */
  static async downloadSkin(id: string, internal = false): Promise<Blob> {
    const headers: HeadersInit = {};

    if (internal) {
      headers['X-Kaizen-Internal'] = 'true';
    }

    // Add auth token if available (for private skins)
    const token = KaizenApi.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${SKIN_API_URL}/skins/${id}/download`, { headers });
    if (!response.ok) {
      throw new SkinApiError('Failed to download skin', response.status);
    }
    return response.blob();
  }

  /** Access skin via share link */
  static async getSharedSkin(token: string): Promise<Skin> {
    return this.request(`/share/${token}`);
  }

  /** Get user's public skins */
  static async getUserSkins(userId: number): Promise<Skin[]> {
    return this.request(`/users/${userId}/skins`);
  }

  /** Get user's stats */
  static async getUserStats(userId: number): Promise<{
    total_skins: number;
    total_downloads: number;
    total_likes: number;
  }> {
    return this.request(`/users/${userId}/stats`);
  }

  // ============================================================================
  // AUTHENTICATED ENDPOINTS
  // ============================================================================

  /** List your own skins */
  static async getMySkins(): Promise<Skin[]> {
    return this.authRequest('/skins');
  }

  /** Create a new skin */
  static async createSkin(data: CreateSkinData): Promise<Skin> {
    return this.authRequest('/skins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  /** Update a skin */
  static async updateSkin(id: string, data: UpdateSkinData): Promise<Skin> {
    return this.authRequest(`/skins/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  /** Delete a skin */
  static async deleteSkin(id: string): Promise<void> {
    return this.authRequest(`/skins/${id}`, { method: 'DELETE' });
  }

  /** Generate share link */
  static async createShareLink(id: string): Promise<{ share_token: string; share_url: string }> {
    return this.authRequest(`/skins/${id}/share`, { method: 'POST' });
  }

  /** Revoke share link */
  static async revokeShareLink(id: string): Promise<void> {
    return this.authRequest(`/skins/${id}/share`, { method: 'DELETE' });
  }

  /** Like a skin */
  static async likeSkin(id: string): Promise<{ message: string; likes_count: number }> {
    return this.authRequest(`/skins/${id}/like`, { method: 'POST' });
  }

  /** Unlike a skin */
  static async unlikeSkin(id: string): Promise<{ message: string; likes_count: number }> {
    return this.authRequest(`/skins/${id}/like`, { method: 'DELETE' });
  }

  /** Get users who liked a skin */
  static async getSkinLikes(id: string): Promise<Array<{
    user_id: number;
    name: string;
    avatar_url?: string;
  }>> {
    return this.request(`/skins/${id}/likes`);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /** Convert ImageData to base64 PNG string */
  static async imageDataToBase64(imageData: ImageData): Promise<string> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64); // Includes data:image/png;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /** Upload current skin from editor */
  static async uploadFromImageData(
    imageData: ImageData,
    metadata: {
      name: string;
      description?: string;
      visibility?: SkinVisibility;
      tags?: string[];
      category_ids?: number[];
    }
  ): Promise<Skin> {
    const skin_data = await this.imageDataToBase64(imageData);
    return this.createSkin({
      ...metadata,
      skin_data,
    });
  }
}

export { SkinApiError };
