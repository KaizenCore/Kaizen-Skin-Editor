import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  LocalSkinStorage,
  type LocalSkinEntry,
  type LocalLibrarySettings,
  DEFAULT_SETTINGS,
} from '@/lib/storage';
import { useEditorStore } from './editorStore';
import { toast } from '@/lib/toast';

interface LocalLibraryState {
  entries: LocalSkinEntry[];
  isLoading: boolean;
  settings: LocalLibrarySettings;
  currentAutoSaveId: string | null;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  loadEntries: () => Promise<void>;
  saveCurrent: (name?: string, isAutoSave?: boolean) => Promise<string | null>;
  loadEntry: (id: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  renameEntry: (id: string, name: string) => Promise<void>;
  duplicateEntry: (id: string) => Promise<string | null>;
  updateSettings: (settings: Partial<LocalLibrarySettings>) => void;
  setCurrentAutoSaveId: (id: string | null) => void;
  clearCurrentAutoSave: () => void;
}

export const useLocalLibraryStore = create<LocalLibraryState>()(
  persist(
    (set, get) => ({
      entries: [],
      isLoading: false,
      settings: DEFAULT_SETTINGS,
      currentAutoSaveId: null,
      isInitialized: false,

      initialize: async () => {
        if (get().isInitialized) return;

        try {
          if (!LocalSkinStorage.isSupported()) {
            console.warn('IndexedDB not supported, local library disabled');
            return;
          }

          await LocalSkinStorage.initialize();
          set({ isInitialized: true });

          // Load entries after initialization
          await get().loadEntries();
        } catch (err) {
          console.error('Failed to initialize local library:', err);
        }
      },

      loadEntries: async () => {
        if (!get().isInitialized) return;

        set({ isLoading: true });
        try {
          const entries = await LocalSkinStorage.getAllSkins();
          set({ entries, isLoading: false });
        } catch (err) {
          console.error('Failed to load local skins:', err);
          set({ isLoading: false });
        }
      },

      saveCurrent: async (name?: string, isAutoSave = false) => {
        const { document, getCompositeImageData } = useEditorStore.getState();

        if (!document) {
          if (!isAutoSave) {
            toast.error('Nothing to save', 'No skin is currently open');
          }
          return null;
        }

        try {
          const compositeImageData = getCompositeImageData();
          if (!compositeImageData) {
            throw new Error('Failed to get composite image data');
          }

          // For auto-save, update existing entry if we have one
          let entryId: string;
          const currentAutoSaveId = get().currentAutoSaveId;

          if (isAutoSave && currentAutoSaveId) {
            // Update existing auto-save
            const existing = await LocalSkinStorage.getSkin(currentAutoSaveId);
            if (existing) {
              const entry = await LocalSkinStorage.serializeDocument(
                { ...document, id: currentAutoSaveId },
                compositeImageData,
                true
              );
              await LocalSkinStorage.saveSkin(entry);
              entryId = currentAutoSaveId;
            } else {
              // Create new if existing not found
              const entry = await LocalSkinStorage.serializeDocument(
                document,
                compositeImageData,
                true
              );
              await LocalSkinStorage.saveSkin(entry);
              entryId = entry.id;
              set({ currentAutoSaveId: entryId });
            }
          } else {
            // Create new entry (manual save or first auto-save)
            const docToSave = name ? { ...document, name } : document;
            const entry = await LocalSkinStorage.serializeDocument(
              docToSave,
              compositeImageData,
              isAutoSave
            );

            // Generate new ID for manual saves to not overwrite
            if (!isAutoSave) {
              entry.id = crypto.randomUUID();
            }

            await LocalSkinStorage.saveSkin(entry);
            entryId = entry.id;

            if (isAutoSave) {
              set({ currentAutoSaveId: entryId });
            }
          }

          // Prune old auto-saves if needed
          if (isAutoSave) {
            const { maxAutoSaves } = get().settings;
            await LocalSkinStorage.pruneAutoSaves(maxAutoSaves);
          }

          // Reload entries
          await get().loadEntries();

          if (!isAutoSave) {
            toast.success('Saved locally', `"${name || document.name}" saved to local library`);
          }

          return entryId;
        } catch (err) {
          console.error('Failed to save skin locally:', err);
          if (!isAutoSave) {
            toast.error('Save failed', 'Could not save skin to local library');
          }
          return null;
        }
      },

      loadEntry: async (id: string) => {
        try {
          const entry = await LocalSkinStorage.getSkin(id);
          if (!entry) {
            toast.error('Not found', 'Skin not found in local library');
            return;
          }

          const document = LocalSkinStorage.deserializeToDocument(entry);
          const { loadFromDocument } = useEditorStore.getState();

          loadFromDocument(document);

          // If loading a non-auto-save, clear auto-save tracking
          if (!entry.isAutoSave) {
            set({ currentAutoSaveId: null });
          } else {
            set({ currentAutoSaveId: id });
          }

          toast.success('Loaded', `"${entry.name}" loaded from local library`);
        } catch (err) {
          console.error('Failed to load local skin:', err);
          toast.error('Load failed', 'Could not load skin from local library');
        }
      },

      deleteEntry: async (id: string) => {
        try {
          const entry = await LocalSkinStorage.getSkin(id);
          await LocalSkinStorage.deleteSkin(id);

          // Clear auto-save ID if we deleted the current auto-save
          if (get().currentAutoSaveId === id) {
            set({ currentAutoSaveId: null });
          }

          await get().loadEntries();
          toast.success('Deleted', entry ? `"${entry.name}" removed` : 'Skin removed');
        } catch (err) {
          console.error('Failed to delete local skin:', err);
          toast.error('Delete failed', 'Could not delete skin from local library');
        }
      },

      renameEntry: async (id: string, name: string) => {
        try {
          await LocalSkinStorage.updateSkin(id, { name });
          await get().loadEntries();
          toast.success('Renamed', `Skin renamed to "${name}"`);
        } catch (err) {
          console.error('Failed to rename local skin:', err);
          toast.error('Rename failed', 'Could not rename skin');
        }
      },

      duplicateEntry: async (id: string) => {
        try {
          const entry = await LocalSkinStorage.getSkin(id);
          if (!entry) {
            toast.error('Not found', 'Skin not found in local library');
            return null;
          }

          const newEntry: LocalSkinEntry = {
            ...entry,
            id: crypto.randomUUID(),
            name: `${entry.name} (copy)`,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            isAutoSave: false,
          };

          await LocalSkinStorage.saveSkin(newEntry);
          await get().loadEntries();

          toast.success('Duplicated', `Created "${newEntry.name}"`);
          return newEntry.id;
        } catch (err) {
          console.error('Failed to duplicate local skin:', err);
          toast.error('Duplicate failed', 'Could not duplicate skin');
          return null;
        }
      },

      updateSettings: (newSettings: Partial<LocalLibrarySettings>) => {
        const settings = { ...get().settings, ...newSettings };
        set({ settings });
        LocalSkinStorage.saveSettings(settings);
      },

      setCurrentAutoSaveId: (id: string | null) => {
        set({ currentAutoSaveId: id });
      },

      clearCurrentAutoSave: () => {
        set({ currentAutoSaveId: null });
      },
    }),
    {
      name: 'local-library-store',
      partialize: (state) => ({
        settings: state.settings,
        currentAutoSaveId: state.currentAutoSaveId,
      }),
    }
  )
);
