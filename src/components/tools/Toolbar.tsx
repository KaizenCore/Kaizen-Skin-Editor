import {
  Pencil,
  Eraser,
  Pipette,
  PaintBucket,
  Square,
  Undo2,
  Redo2,
  Grid3X3,
  Layers,
  FlipHorizontal,
  FlipVertical,
  Replace,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEditorStore } from '@/stores/editorStore';
import type { ToolId, SymmetryMode } from '@/lib/core/types';

const tools: { id: ToolId; icon: typeof Pencil; label: string; shortcut: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'fill', icon: PaintBucket, label: 'Fill', shortcut: 'G' },
  { id: 'color-replacement', icon: Replace, label: 'Color Replacement', shortcut: 'R' },
  { id: 'selection', icon: Square, label: 'Selection', shortcut: 'M' },
];

export function Toolbar() {
  const {
    activeTool,
    setTool,
    symmetryMode,
    setSymmetryMode,
    showGrid,
    setShowGrid,
    showOverlay,
    setShowOverlay,
    historyState,
    undo,
    redo,
  } = useEditorStore();

  const handleSymmetryToggle = (mode: SymmetryMode) => {
    setSymmetryMode(symmetryMode === mode ? 'none' : mode);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col items-center py-2 gap-1 h-full">
        {/* Drawing Tools */}
        <div className="flex flex-col gap-1">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={activeTool === tool.id}
                  onPressedChange={() => setTool(tool.id)}
                  size="sm"
                  className="w-10 h-10"
                >
                  <tool.icon className="h-5 w-5" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{tool.label} ({tool.shortcut})</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <Separator className="my-2 w-8" />

        {/* Symmetry */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={symmetryMode === 'horizontal' || symmetryMode === 'both'}
                onPressedChange={() => handleSymmetryToggle('horizontal')}
                size="sm"
                className="w-10 h-10"
              >
                <FlipHorizontal className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Horizontal Symmetry</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={symmetryMode === 'vertical' || symmetryMode === 'both'}
                onPressedChange={() => handleSymmetryToggle('vertical')}
                size="sm"
                className="w-10 h-10"
              >
                <FlipVertical className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Vertical Symmetry</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator className="my-2 w-8" />

        {/* View Options */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={showGrid}
                onPressedChange={setShowGrid}
                size="sm"
                className="w-10 h-10"
              >
                <Grid3X3 className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Show Grid</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={showOverlay}
                onPressedChange={setShowOverlay}
                size="sm"
                className="w-10 h-10"
              >
                <Layers className="h-5 w-5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Show Body Parts</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                onClick={undo}
                disabled={!historyState.canUndo}
              >
                <Undo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Undo (Ctrl+Z)</p>
              {historyState.undoDescription && (
                <p className="text-muted-foreground">{historyState.undoDescription}</p>
              )}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10"
                onClick={redo}
                disabled={!historyState.canRedo}
              >
                <Redo2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Redo (Ctrl+Y)</p>
              {historyState.redoDescription && (
                <p className="text-muted-foreground">{historyState.redoDescription}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
