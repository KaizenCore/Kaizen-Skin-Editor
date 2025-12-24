import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useThemeStore } from '@/stores/themeStore';
import { Canvas2DRenderer } from '@/renderer/canvas2d/Canvas2DRenderer';
import { useToolHandler } from '@/hooks/useToolHandler';
import { Button } from '@/components/ui/button';

type LayerHighlight = 'all' | 'base' | 'overlay';

export function Canvas2DView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<Canvas2DRenderer | null>(null);

  // View state
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);
  const [layerHighlight, setLayerHighlight] = useState<LayerHighlight>('all');
  const [showLabels, setShowLabels] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(8);

  // Track if using right mouse button
  const isRightClickRef = useRef(false);

  // Tool handler hook
  const {
    handleStart,
    handleMove,
    handleEnd,
    isToolActive,
    getPreviewPixels,
  } = useToolHandler({ viewType: '2d' });

  // Store state
  const {
    document,
    compositeImageData,
    activeTool,
    selection,
    showGrid,
    showOverlay,
    syncManager,
  } = useEditorStore();

  // Theme state - subscribe to trigger re-render on theme change
  const { currentThemeId, isDarkMode } = useThemeStore();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const renderer = new Canvas2DRenderer({
      canvas: canvasRef.current,
      skinWidth: document?.width ?? 64,
      skinHeight: document?.height ?? 64,
    });

    rendererRef.current = renderer;

    // Initial resize
    const rect = containerRef.current.getBoundingClientRect();
    renderer.resize(rect.width, rect.height);
    renderer.centerView();

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [document?.width, document?.height]);

  // Handle resize
  useEffect(() => {
    if (!containerRef.current || !rendererRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        rendererRef.current?.resize(width, height);
        rendererRef.current?.centerView();
        renderCanvas();
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Update renderer settings
  useEffect(() => {
    rendererRef.current?.setShowGrid(showGrid);
    rendererRef.current?.setShowOverlay(showOverlay);
    rendererRef.current?.setHighlightLayer(layerHighlight);
    rendererRef.current?.setShowLabels(showLabels);
    renderCanvas();
  }, [showGrid, showOverlay, layerHighlight, showLabels]);

  // Synchronous render function - called directly after paint operations
  const renderCanvas = useCallback(() => {
    if (!rendererRef.current || !document) return;

    // Render layers
    rendererRef.current.render(document.layers, selection);
    setCurrentZoom(rendererRef.current.zoom);

    // Render preview pixels from active tool
    const previewPixels = getPreviewPixels();
    if (previewPixels.length > 0) {
      rendererRef.current.renderPreview(previewPixels);
    }
  }, [document, selection, getPreviewPixels]);

  // Render on document/composite change (for external changes like undo/redo)
  useEffect(() => {
    renderCanvas();
  }, [compositeImageData, selection, renderCanvas]);

  // Re-render when theme changes
  useEffect(() => {
    renderCanvas();
  }, [currentThemeId, isDarkMode, renderCanvas]);

  // Subscribe to sync events
  useEffect(() => {
    return syncManager.subscribe({
      id: 'canvas2d',
      onSync: () => renderCanvas(),
    });
  }, [syncManager, renderCanvas]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!rendererRef.current) return;

      // Space+drag = panning
      if (isSpacePressed) {
        setIsPanning(true);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        return;
      }

      const point = rendererRef.current.screenToSkin(e.clientX, e.clientY);
      if (!point) return;

      isRightClickRef.current = e.button === 2;
      handleStart(point.x, point.y, isRightClickRef.current);
      renderCanvas();
    },
    [isSpacePressed, handleStart, renderCanvas]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!rendererRef.current) return;

      // Handle panning
      if (isPanning && lastPanPoint) {
        const dx = e.clientX - lastPanPoint.x;
        const dy = e.clientY - lastPanPoint.y;
        const currentPan = { x: rendererRef.current.panX, y: rendererRef.current.panY };
        rendererRef.current.setPan(currentPan.x + dx, currentPan.y + dy);
        setLastPanPoint({ x: e.clientX, y: e.clientY });
        renderCanvas();
        return;
      }

      if (!isToolActive()) return;

      const point = rendererRef.current.screenToSkin(e.clientX, e.clientY);
      if (!point) return;

      handleMove(point.x, point.y, isRightClickRef.current);
      renderCanvas();
    },
    [isPanning, lastPanPoint, isToolActive, handleMove, renderCanvas]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // End panning
      if (isPanning) {
        setIsPanning(false);
        setLastPanPoint(null);
        return;
      }

      if (!isToolActive()) return;

      const point = rendererRef.current?.screenToSkin(e.clientX, e.clientY);
      if (point) {
        handleEnd(point.x, point.y);
      } else {
        // End at last known position if mouse left canvas
        handleEnd(0, 0);
      }

      isRightClickRef.current = false;
      renderCanvas();
    },
    [isPanning, isToolActive, handleEnd, renderCanvas]
  );

  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      setLastPanPoint(null);
      return;
    }

    if (isToolActive()) {
      handleEnd(0, 0);
      isRightClickRef.current = false;
      renderCanvas();
    }
  }, [isPanning, isToolActive, handleEnd, renderCanvas]);

  // Wheel zoom - use native event listener to prevent passive issue
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!rendererRef.current) return;

      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = rendererRef.current.zoom + delta;
      rendererRef.current.setZoom(newZoom);
      renderCanvas();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [renderCanvas]);

  // Keyboard events for space+drag panning
  useEffect(() => {
    const isInputElement = (target: EventTarget | null): boolean => {
      return target instanceof HTMLInputElement ||
             target instanceof HTMLTextAreaElement ||
             (target instanceof HTMLElement && target.isContentEditable);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture space when typing in inputs
      if (isInputElement(e.target)) return;

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't capture space when typing in inputs
      if (isInputElement(e.target)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
        setLastPanPoint(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Cursor style based on tool and space state
  const getCursorClass = () => {
    if (isSpacePressed) return isPanning ? 'cursor-grabbing' : 'cursor-grab';
    return {
      pencil: 'cursor-crosshair',
      eraser: 'cursor-cell',
      eyedropper: 'cursor-crosshair',
      fill: 'cursor-cell',
      selection: 'cursor-crosshair',
      gradient: 'cursor-crosshair',
      noise: 'cursor-crosshair',
      line: 'cursor-crosshair',
      'color-replacement': 'cursor-crosshair',
    }[activeTool] ?? 'cursor-default';
  };
  const cursorClass = getCursorClass();

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${cursorClass}`}
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      {/* Template Controls */}
      <div className="absolute top-2 left-2 flex gap-1">
        <Button
          variant={layerHighlight === 'all' ? 'default' : 'secondary'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setLayerHighlight('all')}
        >
          All
        </Button>
        <Button
          variant={layerHighlight === 'base' ? 'default' : 'secondary'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setLayerHighlight('base')}
        >
          Base
        </Button>
        <Button
          variant={layerHighlight === 'overlay' ? 'default' : 'secondary'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setLayerHighlight('overlay')}
        >
          Overlay
        </Button>
        <div className="w-px bg-white/20 mx-1" />
        <Button
          variant={showLabels ? 'default' : 'secondary'}
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={() => setShowLabels(!showLabels)}
        >
          Labels
        </Button>
      </div>

      {/* Layer Legend */}
      <div className="absolute top-2 right-2 bg-black/70 rounded p-2 text-xs space-y-1">
        <div className="text-white/70 font-medium mb-1">Body Parts</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-500/60" />
          <span className="text-white/80">Head</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-green-500/60" />
          <span className="text-white/80">Body</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-blue-500/60" />
          <span className="text-white/80">Right Arm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-purple-500/60" />
          <span className="text-white/80">Left Arm</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-orange-500/60" />
          <span className="text-white/80">Right Leg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-pink-500/60" />
          <span className="text-white/80">Left Leg</span>
        </div>
        <div className="border-t border-white/20 mt-2 pt-2 text-white/50">
          <div>Solid = Base layer</div>
          <div>Faded = Overlay layer</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs flex gap-3">
        <span>Zoom: {currentZoom}x</span>
        <span className="text-white/50">Space+Drag to pan</span>
      </div>
    </div>
  );
}
