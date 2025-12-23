import { useEffect } from 'react';
import { useEditorStore } from '@/stores/editorStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { steveSkinPromise } from '@/lib/core/types';
import { MenuBar } from './MenuBar';
import { Canvas2DView } from './Canvas2DView';
import { Viewer3D } from './Viewer3D';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

// Initialize tools on app load
import '@/lib/tools';

export function SkinEditor() {
  const { document, newDocument, activeTool } = useEditorStore();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Wait for Steve skin to load, then create default document
  useEffect(() => {
    steveSkinPromise.then(() => {
      if (!document) {
        newDocument({ name: 'New Skin', format: 'modern', model: 'classic' });
      }
    });
  }, [document, newDocument]);

  if (!document) {
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
        <LeftSidebar />

        {/* Main editor area - Split view */}
        <div className="flex-1 flex">
          {/* 2D Canvas */}
          <div className="flex-1 border-r">
            <Canvas2DView />
          </div>

          {/* 3D Viewer */}
          <div className="flex-1">
            <Viewer3D />
          </div>
        </div>

        {/* Right sidebar - Colors + Layers */}
        <RightSidebar />
      </div>

      {/* Status bar */}
      <div className="h-6 px-3 border-t flex items-center text-xs text-muted-foreground bg-muted/30">
        <span>
          Tool: {activeTool} | Layers: {document.layers.length} | Format: {document.format} | Model: {document.model}
        </span>
        <div className="flex-1 text-center text-[10px] opacity-60">
          Not an official Minecraft product. Not approved by or associated with Mojang or Microsoft.
        </div>
        <span>P=Pencil E=Eraser G=Fill L=Line D=Gradient N=Noise</span>
      </div>
    </div>
  );
}
