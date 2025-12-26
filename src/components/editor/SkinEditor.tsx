import { useEffect, useState, useCallback, useRef } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useKeyboardShortcuts, useAutoSave } from '@/hooks';
import { steveSkinPromise } from '@/lib/core/types';
import { MenuBar } from './MenuBar';
import { Canvas2DView } from './Canvas2DView';
import { Viewer3D } from './Viewer3D';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

// Initialize tools on app load
import '@/lib/tools';

export function SkinEditor() {
  const { document: skinDocument, newDocument, activeTool } = useEditorStore();

  // Resizable panel state (percentage for left panel)
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar collapsed state
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // Sidebar locked state (prevents hover open/close)
  const [leftLocked, setLeftLocked] = useState(true);
  const [rightLocked, setRightLocked] = useState(true);

  // Hover delay refs (to allow clicking lock button before opening)
  const leftHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLeftHoverEnter = useCallback(() => {
    if (leftLocked) return;
    leftHoverTimeoutRef.current = setTimeout(() => {
      setLeftCollapsed(false);
    }, 300);
  }, [leftLocked]);

  const handleLeftHoverLeave = useCallback(() => {
    if (leftHoverTimeoutRef.current) {
      clearTimeout(leftHoverTimeoutRef.current);
      leftHoverTimeoutRef.current = null;
    }
    if (!leftLocked) {
      setLeftCollapsed(true);
    }
  }, [leftLocked]);

  const handleRightHoverEnter = useCallback(() => {
    if (rightLocked) return;
    rightHoverTimeoutRef.current = setTimeout(() => {
      setRightCollapsed(false);
    }, 300);
  }, [rightLocked]);

  const handleRightHoverLeave = useCallback(() => {
    if (rightHoverTimeoutRef.current) {
      clearTimeout(rightHoverTimeoutRef.current);
      rightHoverTimeoutRef.current = null;
    }
    if (!rightLocked) {
      setRightCollapsed(true);
    }
  }, [rightLocked]);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 20% and 80%
    setSplitPosition(Math.max(20, Math.min(80, percentage)));
  }, [isDragging]);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize auto-save for local library
  useAutoSave();

  // Wait for Steve skin to load, then create default document
  useEffect(() => {
    steveSkinPromise.then(() => {
      if (!skinDocument) {
        newDocument({ name: 'New Skin', format: 'modern', model: 'classic' });
      }
    });
  }, [skinDocument, newDocument]);

  if (!skinDocument) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Menu bar */}
      <MenuBar />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Tools + Brush Settings */}
        <LeftSidebar
          collapsed={leftCollapsed}
          onToggleCollapse={() => setLeftCollapsed(!leftCollapsed)}
          locked={leftLocked}
          onToggleLock={() => setLeftLocked(!leftLocked)}
          onHoverEnter={handleLeftHoverEnter}
          onHoverLeave={handleLeftHoverLeave}
        />

        {/* Main editor area - Split view */}
        <div className="flex-1 flex relative" ref={containerRef}>
          {/* 2D Canvas */}
          <div
            className="h-full overflow-hidden"
            style={{ width: `${splitPosition}%` }}
          >
            <Canvas2DView />
          </div>

          {/* Resizable divider */}
          <div
            className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors flex-shrink-0 ${
              isDragging ? 'bg-primary' : ''
            }`}
            onMouseDown={() => setIsDragging(true)}
          />

          {/* 3D Viewer */}
          <div
            className="h-full overflow-hidden"
            style={{ width: `${100 - splitPosition}%` }}
          >
            <Viewer3D />
          </div>
        </div>

        {/* Right sidebar - Colors + Layers */}
        <RightSidebar
          collapsed={rightCollapsed}
          onToggleCollapse={() => setRightCollapsed(!rightCollapsed)}
          locked={rightLocked}
          onToggleLock={() => setRightLocked(!rightLocked)}
          onHoverEnter={handleRightHoverEnter}
          onHoverLeave={handleRightHoverLeave}
        />
      </div>

      {/* Status bar */}
      <div className="h-6 px-3 border-t flex items-center text-xs text-muted-foreground bg-muted/30">
        <span>
          Tool: {activeTool} | Layers: {skinDocument.layers.length} | Format: {skinDocument.format} | Model: {skinDocument.model}
        </span>
        <div className="flex-1 text-center text-[10px] opacity-60">
          Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
        </div>
        <span>P=Pencil E=Eraser G=Fill L=Line D=Gradient N=Noise</span>
      </div>
    </div>
  );
}
