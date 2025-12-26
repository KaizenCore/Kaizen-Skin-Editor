import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useLocalLibraryStore } from '@/stores/localLibraryStore';
import { toast } from '@/lib/toast';
import type { ToolId } from '@/lib/core/types';

const toolShortcuts: Record<string, ToolId> = {
  p: 'pencil',
  e: 'eraser',
  i: 'eyedropper',
  g: 'fill',
  m: 'selection',
  l: 'line',
  d: 'gradient',
  n: 'noise',
};

interface KeyboardShortcutsCallbacks {
  onExport?: () => void;
}

// Store callbacks ref to be set by MenuBar
let callbacks: KeyboardShortcutsCallbacks = {};

export function setKeyboardCallbacks(cbs: KeyboardShortcutsCallbacks) {
  callbacks = cbs;
}

export function useKeyboardShortcuts() {
  const { setTool, undo, redo, swapColors, setBrushSize, brushSize, document } = useEditorStore();
  const { saveCurrent, isInitialized } = useLocalLibraryStore();
  const isSavingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+S - Save locally
      if (ctrl && key === 's' && !shift) {
        e.preventDefault();
        if (!document || isSavingRef.current || !isInitialized) return;

        isSavingRef.current = true;
        try {
          await saveCurrent();
          toast.success('Saved', 'Skin saved to local library');
        } catch (err) {
          console.error('Save failed:', err);
          toast.error('Save failed', 'Could not save to local library');
        } finally {
          isSavingRef.current = false;
        }
        return;
      }

      // Ctrl+Shift+S - Export dialog
      if (ctrl && key === 's' && shift) {
        e.preventDefault();
        callbacks.onExport?.();
        return;
      }

      // Ctrl+E - Export dialog (alternative)
      if (ctrl && key === 'e') {
        e.preventDefault();
        callbacks.onExport?.();
        return;
      }

      // Undo/Redo
      if (ctrl && key === 'z' && !shift) {
        e.preventDefault();
        undo();
        return;
      }

      if (ctrl && (key === 'y' || (key === 'z' && shift))) {
        e.preventDefault();
        redo();
        return;
      }

      // Swap colors
      if (key === 'x') {
        swapColors();
        return;
      }

      // Brush size
      if (key === '[') {
        setBrushSize(Math.max(1, brushSize - 1));
        return;
      }

      if (key === ']') {
        setBrushSize(Math.min(64, brushSize + 1));
        return;
      }

      // Tool shortcuts
      if (!ctrl && !e.altKey) {
        const tool = toolShortcuts[key];
        if (tool) {
          setTool(tool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTool, undo, redo, swapColors, setBrushSize, brushSize, document, saveCurrent, isInitialized]);
}
