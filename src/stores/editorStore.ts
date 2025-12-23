import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  SkinDocument,
  SkinFormat,
  SkinModel,
  Layer,
  RGBA,
  ToolId,
  SymmetryMode,
  Selection,
  BlendMode,
  BodyPartName,
} from '@/lib/core/types';
import type { Skin } from '@/lib/io/SkinApi';

/** Which layer type to paint on */
export type PaintTarget = 'base' | 'overlay';

/** Visibility state for each body part */
export type BodyPartVisibility = Record<BodyPartName, boolean>;
import { createSkinDocument, createLayer, cloneImageData } from '@/lib/core/types';
import { HistoryManager, type HistoryState, type Command } from '@/lib/history';
import { SynchronizationManager } from '@/lib/core/SynchronizationManager';

interface EditorState {
  // Document
  document: SkinDocument | null;

  // Source skin (loaded from gallery)
  sourceSkin: Skin | null;

  // Managers
  historyManager: HistoryManager;
  syncManager: SynchronizationManager;

  // UI State
  activeTool: ToolId;
  primaryColor: RGBA;
  secondaryColor: RGBA;
  brushSize: number;
  brushOpacity: number;
  symmetryMode: SymmetryMode;
  selection: Selection | null;
  hoveredPart: string | null;
  showGrid: boolean;
  showOverlay: boolean;

  // 3D View State
  paintTarget: PaintTarget;
  bodyPartVisibility: BodyPartVisibility;

  // Computed
  compositeImageData: ImageData | null;
  historyState: HistoryState;

  // Actions
  newDocument: (options?: { name?: string; format?: SkinFormat; model?: SkinModel }) => void;
  loadSkin: (imageData: ImageData, format: SkinFormat, model: SkinModel, name?: string, sourceSkin?: Skin) => void;
  setSourceSkin: (skin: Skin | null) => void;
  clearSourceSkin: () => void;
  setTool: (toolId: ToolId) => void;
  setPrimaryColor: (color: RGBA) => void;
  setSecondaryColor: (color: RGBA) => void;
  swapColors: () => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setSymmetryMode: (mode: SymmetryMode) => void;
  setSelection: (selection: Selection | null) => void;
  setHoveredPart: (part: string | null) => void;
  setShowGrid: (show: boolean) => void;
  setShowOverlay: (show: boolean) => void;

  // 3D View actions
  setPaintTarget: (target: PaintTarget) => void;
  setBodyPartVisibility: (part: BodyPartName, visible: boolean) => void;
  toggleBodyPartVisibility: (part: BodyPartName) => void;
  setAllBodyPartsVisible: (visible: boolean) => void;

  // Layer actions
  getActiveLayer: () => Layer | undefined;
  setActiveLayer: (layerId: string) => void;
  addLayer: (name?: string) => void;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;
  renameLayer: (layerId: string, name: string) => void;
  mergeDown: (layerId: string) => void;
  flattenLayers: () => void;

  // History actions
  undo: () => void;
  redo: () => void;
  executeCommand: (command: Command) => void;

  // Composite
  updateComposite: () => void;
  /** Request a batched composite update (uses RAF, coalesces multiple calls) */
  requestCompositeUpdate: () => void;
}

const initialHistoryState: HistoryState = {
  canUndo: false,
  canRedo: false,
  undoDescription: null,
  redoDescription: null,
  historyLength: 0,
  currentIndex: 0,
};

const initialBodyPartVisibility: BodyPartVisibility = {
  head: true,
  body: true,
  rightArm: true,
  leftArm: true,
  rightLeg: true,
  leftLeg: true,
};

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    document: null,
    sourceSkin: null,
    historyManager: new HistoryManager(),
    syncManager: new SynchronizationManager(),
    activeTool: 'pencil',
    primaryColor: [0, 0, 0, 255],
    secondaryColor: [255, 255, 255, 255],
    brushSize: 1,
    brushOpacity: 1,
    symmetryMode: 'none',
    selection: null,
    hoveredPart: null,
    showGrid: true,
    showOverlay: true,
    paintTarget: 'base',
    bodyPartVisibility: { ...initialBodyPartVisibility },
    compositeImageData: null,
    historyState: initialHistoryState,

    // Document actions
    newDocument: (options = {}) => {
      const document = createSkinDocument(options);

      const { historyManager } = get();
      historyManager.clear();

      set({
        document,
        sourceSkin: null, // Clear source skin when creating new document
        historyState: historyManager.getState(),
      });

      get().updateComposite();
      get().syncManager.emitImmediate({ type: 'full-update' });
    },

    loadSkin: (imageData, format, model, name, sourceSkin) => {
      const document = createSkinDocument({
        format,
        model,
        name: name ?? 'Imported Skin',
        useSteveSkin: false, // Don't use Steve as base, we're loading a custom skin
      });

      // Set the layer's imageData
      if (document.layers[0]) {
        document.layers[0].imageData = cloneImageData(imageData);
      }

      const { historyManager } = get();
      historyManager.clear();

      set({
        document,
        sourceSkin: sourceSkin ?? null, // Set source skin if provided
        historyState: historyManager.getState(),
      });

      get().updateComposite();
      get().syncManager.emitImmediate({ type: 'full-update' });
    },

    setSourceSkin: (skin) => set({ sourceSkin: skin }),
    clearSourceSkin: () => set({ sourceSkin: null }),

    // Tool actions
    setTool: (toolId) => set({ activeTool: toolId }),
    setPrimaryColor: (color) => set({ primaryColor: color }),
    setSecondaryColor: (color) => set({ secondaryColor: color }),
    swapColors: () => {
      const { primaryColor, secondaryColor } = get();
      set({ primaryColor: secondaryColor, secondaryColor: primaryColor });
    },
    setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(64, size)) }),
    setBrushOpacity: (opacity) => set({ brushOpacity: Math.max(0, Math.min(1, opacity)) }),
    setSymmetryMode: (mode) => set({ symmetryMode: mode }),
    setSelection: (selection) => {
      set({ selection });
      get().syncManager.emit({ type: 'selection-change', selection });
    },
    setHoveredPart: (part) => set({ hoveredPart: part }),
    setShowGrid: (show) => set({ showGrid: show }),
    setShowOverlay: (show) => set({ showOverlay: show }),

    // 3D View actions
    setPaintTarget: (target) => set({ paintTarget: target }),
    setBodyPartVisibility: (part, visible) => {
      const { bodyPartVisibility } = get();
      set({
        bodyPartVisibility: { ...bodyPartVisibility, [part]: visible },
      });
    },
    toggleBodyPartVisibility: (part) => {
      const { bodyPartVisibility } = get();
      set({
        bodyPartVisibility: { ...bodyPartVisibility, [part]: !bodyPartVisibility[part] },
      });
    },
    setAllBodyPartsVisible: (visible) => {
      set({
        bodyPartVisibility: {
          head: visible,
          body: visible,
          rightArm: visible,
          leftArm: visible,
          rightLeg: visible,
          leftLeg: visible,
        },
      });
    },

    // Layer actions
    getActiveLayer: () => {
      const { document } = get();
      if (!document) return undefined;
      return document.layers.find((l) => l.id === document.activeLayerId);
    },

    setActiveLayer: (layerId) => {
      const { document } = get();
      if (!document) return;

      const layer = document.layers.find((l) => l.id === layerId);
      if (layer) {
        set({
          document: { ...document, activeLayerId: layerId },
        });
      }
    },

    addLayer: (name) => {
      const { document } = get();
      if (!document) return;

      const newLayer = createLayer(
        name ?? `Layer ${document.layers.length + 1}`,
        document.width,
        document.height
      );

      const activeIndex = document.layers.findIndex((l) => l.id === document.activeLayerId);
      const insertIndex = activeIndex + 1;

      const newLayers = [...document.layers];
      newLayers.splice(insertIndex, 0, newLayer);

      set({
        document: {
          ...document,
          layers: newLayers,
          activeLayerId: newLayer.id,
        },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'full-update' });
    },

    deleteLayer: (layerId) => {
      const { document } = get();
      if (!document || document.layers.length <= 1) return;

      const index = document.layers.findIndex((l) => l.id === layerId);
      if (index === -1) return;

      const newLayers = document.layers.filter((l) => l.id !== layerId);
      let newActiveId = document.activeLayerId;

      if (document.activeLayerId === layerId) {
        newActiveId = newLayers[Math.max(0, index - 1)]?.id ?? newLayers[0]?.id ?? '';
      }

      set({
        document: {
          ...document,
          layers: newLayers,
          activeLayerId: newActiveId,
        },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'full-update' });
    },

    duplicateLayer: (layerId) => {
      const { document } = get();
      if (!document) return;

      const layer = document.layers.find((l) => l.id === layerId);
      if (!layer) return;

      const duplicate: Layer = {
        ...layer,
        id: crypto.randomUUID(),
        name: `${layer.name} Copy`,
        imageData: cloneImageData(layer.imageData),
      };

      const index = document.layers.findIndex((l) => l.id === layerId);
      const newLayers = [...document.layers];
      newLayers.splice(index + 1, 0, duplicate);

      set({
        document: {
          ...document,
          layers: newLayers,
          activeLayerId: duplicate.id,
        },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'full-update' });
    },

    moveLayer: (layerId, direction) => {
      const { document } = get();
      if (!document) return;

      const index = document.layers.findIndex((l) => l.id === layerId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index + 1 : index - 1;
      if (newIndex < 0 || newIndex >= document.layers.length) return;

      const newLayers = [...document.layers];
      const [layer] = newLayers.splice(index, 1);
      if (layer) {
        newLayers.splice(newIndex, 0, layer);
      }

      set({
        document: { ...document, layers: newLayers },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'full-update' });
    },

    setLayerVisibility: (layerId, visible) => {
      const { document } = get();
      if (!document) return;

      const newLayers = document.layers.map((l) =>
        l.id === layerId ? { ...l, visible } : l
      );

      set({
        document: { ...document, layers: newLayers },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'layer-change', layerId });
    },

    setLayerOpacity: (layerId, opacity) => {
      const { document } = get();
      if (!document) return;

      const newLayers = document.layers.map((l) =>
        l.id === layerId ? { ...l, opacity: Math.max(0, Math.min(1, opacity)) } : l
      );

      set({
        document: { ...document, layers: newLayers },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'layer-change', layerId });
    },

    setLayerBlendMode: (layerId, blendMode) => {
      const { document } = get();
      if (!document) return;

      const newLayers = document.layers.map((l) =>
        l.id === layerId ? { ...l, blendMode } : l
      );

      set({
        document: { ...document, layers: newLayers },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'layer-change', layerId });
    },

    renameLayer: (layerId, name) => {
      const { document } = get();
      if (!document) return;

      const newLayers = document.layers.map((l) =>
        l.id === layerId ? { ...l, name } : l
      );

      set({
        document: { ...document, layers: newLayers },
      });
    },

    mergeDown: (layerId) => {
      const { document } = get();
      if (!document) return;

      const index = document.layers.findIndex((l) => l.id === layerId);
      if (index <= 0) return; // Can't merge bottom layer

      const upper = document.layers[index]!;
      const lower = document.layers[index - 1]!;

      // Composite upper onto lower using OffscreenCanvas
      const canvas = new OffscreenCanvas(document.width, document.height);
      const ctx = canvas.getContext('2d')!;

      ctx.putImageData(lower.imageData, 0, 0);
      ctx.globalAlpha = upper.opacity;
      ctx.globalCompositeOperation = upper.blendMode as GlobalCompositeOperation;

      const upperCanvas = new OffscreenCanvas(document.width, document.height);
      const upperCtx = upperCanvas.getContext('2d')!;
      upperCtx.putImageData(upper.imageData, 0, 0);
      ctx.drawImage(upperCanvas, 0, 0);

      const mergedImageData = ctx.getImageData(0, 0, document.width, document.height);

      const newLayers = [...document.layers];
      newLayers[index - 1] = { ...lower, imageData: mergedImageData };
      newLayers.splice(index, 1);

      set({
        document: {
          ...document,
          layers: newLayers,
          activeLayerId: lower.id,
        },
      });

      get().updateComposite();
      get().syncManager.emit({ type: 'full-update' });
    },

    flattenLayers: () => {
      const { document, compositeImageData } = get();
      if (!document || !compositeImageData) return;

      const flatLayer: Layer = {
        id: crypto.randomUUID(),
        name: 'Background',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        imageData: cloneImageData(compositeImageData),
      };

      set({
        document: {
          ...document,
          layers: [flatLayer],
          activeLayerId: flatLayer.id,
        },
      });

      get().syncManager.emit({ type: 'full-update' });
    },

    // History actions
    undo: () => {
      const { historyManager, document, syncManager } = get();
      if (!document) return;

      if (historyManager.undo(document)) {
        set({
          historyState: historyManager.getState(),
        });
        get().updateComposite();
        syncManager.emitImmediate({ type: 'full-update' });
      }
    },

    redo: () => {
      const { historyManager, document, syncManager } = get();
      if (!document) return;

      if (historyManager.redo(document)) {
        set({
          historyState: historyManager.getState(),
        });
        get().updateComposite();
        syncManager.emitImmediate({ type: 'full-update' });
      }
    },

    executeCommand: (command) => {
      const { historyManager, document, syncManager } = get();
      if (!document) return;

      historyManager.execute(command, document);

      set({
        historyState: historyManager.getState(),
      });

      get().updateComposite();
      syncManager.emit({ type: 'full-update' });
    },

    // Composite
    updateComposite: () => {
      const { document } = get();
      if (!document) {
        set({ compositeImageData: null });
        return;
      }

      const canvas = new OffscreenCanvas(document.width, document.height);
      const ctx = canvas.getContext('2d')!;

      for (const layer of document.layers) {
        if (!layer.visible) continue;

        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

        const layerCanvas = new OffscreenCanvas(document.width, document.height);
        const layerCtx = layerCanvas.getContext('2d')!;
        layerCtx.putImageData(layer.imageData, 0, 0);
        ctx.drawImage(layerCanvas, 0, 0);
      }

      set({
        compositeImageData: ctx.getImageData(0, 0, document.width, document.height),
      });
    },

    // Batched composite update using RAF
    requestCompositeUpdate: (() => {
      let rafId: number | null = null;
      return () => {
        if (rafId !== null) return; // Already scheduled
        rafId = requestAnimationFrame(() => {
          rafId = null;
          get().updateComposite();
        });
      };
    })(),
  }))
);
