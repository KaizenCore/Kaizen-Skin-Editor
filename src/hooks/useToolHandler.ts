import { useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { ToolRegistry, type Tool, type ToolContext, type ToolResult, type ViewType } from '@/lib/tools';
import { DrawCommand } from '@/lib/history/Command';

interface UseToolHandlerOptions {
  viewType: ViewType;
}

interface UseToolHandlerReturn {
  /** Handle mouse/pointer down event */
  handleStart: (x: number, y: number, useSecondary: boolean) => ToolResult | null;
  /** Handle mouse/pointer move event */
  handleMove: (x: number, y: number, useSecondary: boolean) => ToolResult | null;
  /** Handle mouse/pointer up event */
  handleEnd: (x: number, y: number) => ToolResult | null;
  /** Get current tool instance */
  getCurrentTool: () => Tool | undefined;
  /** Check if a tool is currently active (drawing) */
  isToolActive: () => boolean;
  /** Cancel current tool operation */
  cancelTool: () => void;
  /** Get preview pixels for rendering */
  getPreviewPixels: () => { x: number; y: number; color: [number, number, number, number] }[];
}

/**
 * Hook that provides unified tool handling for both 2D and 3D views
 */
export function useToolHandler(options: UseToolHandlerOptions): UseToolHandlerReturn {
  const { viewType } = options;

  // Track active tool for this handler
  const activeToolRef = useRef<Tool | null>(null);

  // Get current context from store
  const getContext = useCallback((): ToolContext | null => {
    const store = useEditorStore.getState();
    const layer = store.getActiveLayer();

    if (!layer || !store.document) {
      return null;
    }

    return {
      layerId: layer.id,
      imageData: layer.imageData,
      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,
      brushSize: store.brushSize,
      brushOpacity: store.brushOpacity,
      colorReplaceTolerance: store.colorReplaceTolerance,
      symmetryMode: store.symmetryMode,
      paintTarget: store.paintTarget,
      width: store.document.width,
      height: store.document.height,
      viewType,
      compositeImageData: store.compositeImageData || undefined,
    };
  }, [viewType]);

  // Get current tool from registry
  const getCurrentTool = useCallback((): Tool | undefined => {
    const { activeTool } = useEditorStore.getState();
    return ToolRegistry.get(activeTool);
  }, []);

  // Handle tool start
  const handleStart = useCallback((x: number, y: number, useSecondary: boolean): ToolResult | null => {
    const tool = getCurrentTool();
    const context = getContext();

    if (!tool || !context) {
      return null;
    }

    // Check if layer is locked
    const store = useEditorStore.getState();
    const layer = store.getActiveLayer();
    if (layer?.locked) {
      return null;
    }

    // Reset tool state and start
    tool.reset();
    activeToolRef.current = tool;

    const point = { x: Math.floor(x), y: Math.floor(y) };
    const result = tool.onStart(point, context, useSecondary);

    // Handle eyedropper color pick
    if (result.pickedColor) {
      store.setPrimaryColor(result.pickedColor);
    }

    // Update composite if pixels changed
    if (result.changedPixels.length > 0) {
      store.updateComposite();
    }

    return result;
  }, [getContext, getCurrentTool]);

  // Handle tool move
  const handleMove = useCallback((x: number, y: number, useSecondary: boolean): ToolResult | null => {
    const tool = activeToolRef.current;
    const context = getContext();

    if (!tool || !context) {
      return null;
    }

    const point = { x: Math.floor(x), y: Math.floor(y) };
    const result = tool.onMove(point, context, useSecondary);

    // Handle eyedropper color pick (for preview)
    if (result.pickedColor) {
      // Could show preview color here
    }

    // Update composite if pixels changed
    if (result.changedPixels.length > 0) {
      useEditorStore.getState().updateComposite();
    }

    return result;
  }, [getContext]);

  // Handle tool end
  const handleEnd = useCallback((x: number, y: number): ToolResult | null => {
    const tool = activeToolRef.current;
    const context = getContext();

    if (!tool || !context) {
      activeToolRef.current = null;
      return null;
    }

    const point = { x: Math.floor(x), y: Math.floor(y) };
    const result = tool.onEnd(point, context);

    // Create history command if we have changes
    if (result.isComplete && result.originalPixels.length > 0) {
      const store = useEditorStore.getState();

      // Create and execute draw command
      const command = new DrawCommand(
        context.layerId,
        result.originalPixels,
        result.changedPixels
      );

      store.executeCommand(command);
    } else if (result.changedPixels.length > 0) {
      // Update composite even if not creating command
      useEditorStore.getState().updateComposite();
    }

    // Handle final eyedropper color pick
    if (result.pickedColor) {
      useEditorStore.getState().setPrimaryColor(result.pickedColor);
    }

    // Handle selection tool result
    if (result.selection !== undefined) {
      useEditorStore.getState().setSelection(result.selection);
    }

    activeToolRef.current = null;
    return result;
  }, [getContext]);

  // Check if tool is active
  const isToolActive = useCallback((): boolean => {
    const tool = activeToolRef.current;
    return tool !== null && tool.getState().isActive;
  }, []);

  // Cancel current tool
  const cancelTool = useCallback((): void => {
    const tool = activeToolRef.current;
    if (tool) {
      tool.reset();
      activeToolRef.current = null;
    }
  }, []);

  // Get preview pixels
  const getPreviewPixels = useCallback(() => {
    const tool = activeToolRef.current;
    if (!tool) return [];

    const preview = tool.getPreview?.() || tool.getState().previewPixels || [];
    return preview;
  }, []);

  return {
    handleStart,
    handleMove,
    handleEnd,
    getCurrentTool,
    isToolActive,
    cancelTool,
    getPreviewPixels,
  };
}
