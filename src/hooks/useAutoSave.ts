import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useLocalLibraryStore } from '@/stores/localLibraryStore';

interface UseAutoSaveOptions {
  enabled?: boolean;
  intervalMinutes?: number;
}

interface UseAutoSaveReturn {
  lastSaveTime: number | null;
  isSaving: boolean;
  isDirty: boolean;
  saveNow: () => Promise<void>;
}

/**
 * Hook for automatic local saving of the current skin document
 * Only saves when the document has been modified
 */
export function useAutoSave(options?: UseAutoSaveOptions): UseAutoSaveReturn {
  const { settings, saveCurrent, isInitialized, initialize } = useLocalLibraryStore();
  const document = useEditorStore((state) => state.document);
  const historyState = useEditorStore((state) => state.historyState);

  const lastSaveTimeRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const lastDocumentIdRef = useRef<string | null>(null);
  const lastHistoryLengthRef = useRef(0);

  // Use settings from store if not provided
  const enabled = options?.enabled ?? settings.autoSaveEnabled;
  const intervalMinutes = options?.intervalMinutes ?? settings.autoSaveIntervalMinutes;
  const intervalMs = intervalMinutes * 60 * 1000;

  // Initialize local library on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Track document changes via history
  useEffect(() => {
    if (!document) return;

    // If document ID changed, it's a new document - not dirty yet
    if (document.id !== lastDocumentIdRef.current) {
      lastDocumentIdRef.current = document.id;
      lastHistoryLengthRef.current = historyState.historyLength;
      isDirtyRef.current = false;

      // Clear auto-save tracking for new document
      const { clearCurrentAutoSave } = useLocalLibraryStore.getState();
      clearCurrentAutoSave();
      return;
    }

    // Check if history changed (user made an edit)
    if (historyState.historyLength !== lastHistoryLengthRef.current) {
      lastHistoryLengthRef.current = historyState.historyLength;
      isDirtyRef.current = true;
    }
  }, [document?.id, historyState.historyLength]);

  // Save function - only saves if dirty
  const performSave = useCallback(async (force = false) => {
    if (!document || isSavingRef.current || !isInitialized) return;

    // Skip if not dirty and not forced
    if (!isDirtyRef.current && !force) return;

    isSavingRef.current = true;

    try {
      await saveCurrent(undefined, true); // isAutoSave = true
      lastSaveTimeRef.current = Date.now();
      isDirtyRef.current = false; // Reset dirty flag after successful save
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      isSavingRef.current = false;
    }
  }, [document, saveCurrent, isInitialized]);

  // Manual save function exposed to caller (always saves)
  const saveNow = useCallback(async () => {
    await performSave(true);
  }, [performSave]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled || !isInitialized || !document) return;

    // Regular interval saves (only if dirty)
    const intervalId = setInterval(() => {
      performSave();
    }, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, isInitialized, document, intervalMs, performSave]);

  return {
    lastSaveTime: lastSaveTimeRef.current,
    isSaving: isSavingRef.current,
    isDirty: isDirtyRef.current,
    saveNow,
  };
}
