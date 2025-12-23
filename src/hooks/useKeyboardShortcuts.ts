import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
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

export function useKeyboardShortcuts() {
  const { setTool, undo, redo, swapColors, setBrushSize, brushSize } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [setTool, undo, redo, swapColors, setBrushSize, brushSize]);
}
