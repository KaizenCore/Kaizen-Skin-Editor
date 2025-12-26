import type { SkinDocument, Layer, BlendMode, SkinFormat, SkinModel } from '@/lib/core/types/skin';

/**
 * Serialized layer for IndexedDB storage
 */
export interface SerializedLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: BlendMode;
  imageBuffer: ArrayBuffer;
  width: number;
  height: number;
}

/**
 * Local skin entry stored in IndexedDB
 */
export interface LocalSkinEntry {
  id: string;
  name: string;
  format: SkinFormat;
  model: SkinModel;
  width: 64;
  height: 64 | 32;
  layers: SerializedLayer[];
  activeLayerId: string;
  createdAt: number;
  modifiedAt: number;
  thumbnail: Blob;
  isAutoSave: boolean;
}

/**
 * Settings for local library (stored in localStorage)
 */
export interface LocalLibrarySettings {
  autoSaveEnabled: boolean;
  autoSaveIntervalMinutes: number;
  maxAutoSaves: number;
  warningDismissed: boolean;
}

export const DEFAULT_SETTINGS: LocalLibrarySettings = {
  autoSaveEnabled: true,
  autoSaveIntervalMinutes: 5,
  maxAutoSaves: 10,
  warningDismissed: false,
};

/**
 * IndexedDB wrapper for local skin storage
 */
export class LocalSkinStorage {
  static readonly DB_NAME = 'kaizen-skin-library';
  static readonly DB_VERSION = 1;
  static readonly STORE_NAME = 'skins';
  static readonly SETTINGS_KEY = 'local-library-settings';

  private static db: IDBDatabase | null = null;

  /**
   * Initialize IndexedDB connection
   */
  static async initialize(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('modifiedAt', 'modifiedAt');
          store.createIndex('isAutoSave', 'isAutoSave');
          store.createIndex('name', 'name');
        }
      };
    });
  }

  /**
   * Get database connection (initialize if needed)
   */
  private static async getDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  /**
   * Save a skin entry to IndexedDB
   */
  static async saveSkin(entry: LocalSkinEntry): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Get a skin entry by ID
   */
  static async getSkin(id: string): Promise<LocalSkinEntry | undefined> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  /**
   * Get all skin entries, sorted by modifiedAt descending
   */
  static async getAllSkins(): Promise<LocalSkinEntry[]> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const entries = request.result as LocalSkinEntry[];
        // Sort by modifiedAt descending (newest first)
        entries.sort((a, b) => b.modifiedAt - a.modifiedAt);
        resolve(entries);
      };
    });
  }

  /**
   * Delete a skin entry by ID
   */
  static async deleteSkin(id: string): Promise<void> {
    const db = await this.getDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Update a skin entry (partial update)
   */
  static async updateSkin(id: string, updates: Partial<LocalSkinEntry>): Promise<void> {
    const existing = await this.getSkin(id);
    if (!existing) {
      throw new Error(`Skin with id ${id} not found`);
    }

    const updated: LocalSkinEntry = {
      ...existing,
      ...updates,
      modifiedAt: Date.now(),
    };

    await this.saveSkin(updated);
  }

  /**
   * Serialize a Layer to SerializedLayer for storage
   */
  static serializeLayer(layer: Layer): SerializedLayer {
    // Convert Uint8ClampedArray to ArrayBuffer
    const imageBuffer = layer.imageData.data.buffer.slice(0);

    return {
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
      imageBuffer,
      width: layer.imageData.width,
      height: layer.imageData.height,
    };
  }

  /**
   * Deserialize a SerializedLayer back to Layer
   */
  static deserializeLayer(serialized: SerializedLayer): Layer {
    const data = new Uint8ClampedArray(serialized.imageBuffer);
    const imageData = new ImageData(data, serialized.width, serialized.height);

    return {
      id: serialized.id,
      name: serialized.name,
      visible: serialized.visible,
      locked: serialized.locked,
      opacity: serialized.opacity,
      blendMode: serialized.blendMode,
      imageData,
    };
  }

  /**
   * Serialize a SkinDocument to LocalSkinEntry
   */
  static async serializeDocument(
    doc: SkinDocument,
    compositeImageData: ImageData,
    isAutoSave: boolean
  ): Promise<LocalSkinEntry> {
    const thumbnail = await this.generateThumbnail(compositeImageData);

    return {
      id: doc.id,
      name: doc.name,
      format: doc.format,
      model: doc.model,
      width: 64,
      height: doc.height,
      layers: doc.layers.map((layer) => this.serializeLayer(layer)),
      activeLayerId: doc.activeLayerId,
      createdAt: doc.createdAt.getTime(),
      modifiedAt: Date.now(),
      thumbnail,
      isAutoSave,
    };
  }

  /**
   * Deserialize a LocalSkinEntry back to SkinDocument
   */
  static deserializeToDocument(entry: LocalSkinEntry): SkinDocument {
    return {
      id: entry.id,
      name: entry.name,
      format: entry.format,
      model: entry.model,
      width: 64,
      height: entry.height,
      layers: entry.layers.map((layer) => this.deserializeLayer(layer)),
      activeLayerId: entry.activeLayerId,
      createdAt: new Date(entry.createdAt),
      modifiedAt: new Date(entry.modifiedAt),
    };
  }

  /**
   * Generate a thumbnail PNG blob from composite ImageData
   */
  static async generateThumbnail(imageData: ImageData): Promise<Blob> {
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    return await canvas.convertToBlob({ type: 'image/png' });
  }

  /**
   * Prune old auto-saves to keep only the most recent ones
   */
  static async pruneAutoSaves(maxCount: number): Promise<number> {
    const allSkins = await this.getAllSkins();
    const autoSaves = allSkins
      .filter((s) => s.isAutoSave)
      .sort((a, b) => b.modifiedAt - a.modifiedAt);

    const toDelete = autoSaves.slice(maxCount);
    let deleted = 0;

    for (const skin of toDelete) {
      try {
        await this.deleteSkin(skin.id);
        deleted++;
      } catch (err) {
        console.error('Failed to delete old auto-save:', err);
      }
    }

    return deleted;
  }

  /**
   * Get storage usage info
   */
  static async getStorageInfo(): Promise<{ count: number; autoSaveCount: number }> {
    const allSkins = await this.getAllSkins();
    const autoSaveCount = allSkins.filter((s) => s.isAutoSave).length;

    return {
      count: allSkins.length,
      autoSaveCount,
    };
  }

  /**
   * Load settings from localStorage
   */
  static loadSettings(): LocalLibrarySettings {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.error('Failed to load local library settings:', err);
    }
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  static saveSettings(settings: LocalLibrarySettings): void {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Failed to save local library settings:', err);
    }
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }
}
