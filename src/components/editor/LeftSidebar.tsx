import {
  Pencil,
  Eraser,
  Pipette,
  PaintBucket,
  Square,
  Minus,
  Blend,
  Sparkles,
  Undo2,
  Redo2,
  Grid3X3,
  Layers,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEditorStore } from '@/stores/editorStore';
import type { ToolId, SymmetryMode } from '@/lib/core/types';

// All available tools
const tools: { id: ToolId; icon: typeof Pencil; label: string; shortcut: string }[] = [
  { id: 'pencil', icon: Pencil, label: 'Pencil', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  { id: 'eyedropper', icon: Pipette, label: 'Eyedropper', shortcut: 'I' },
  { id: 'fill', icon: PaintBucket, label: 'Fill', shortcut: 'G' },
  { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
  { id: 'gradient', icon: Blend, label: 'Gradient', shortcut: 'D' },
  { id: 'noise', icon: Sparkles, label: 'Noise', shortcut: 'N' },
  { id: 'selection', icon: Square, label: 'Selection', shortcut: 'M' },
];

// Tools that use brush size
const BRUSH_SIZE_TOOLS: ToolId[] = ['pencil', 'eraser', 'line', 'noise'];

// Tools that use brush opacity
const BRUSH_OPACITY_TOOLS: ToolId[] = ['pencil', 'eraser', 'fill', 'line', 'gradient', 'noise'];

export function LeftSidebar() {
  const {
    activeTool,
    setTool,
    brushSize,
    brushOpacity,
    setBrushSize,
    setBrushOpacity,
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

  const showBrushSize = BRUSH_SIZE_TOOLS.includes(activeTool);
  const showBrushOpacity = BRUSH_OPACITY_TOOLS.includes(activeTool);

  const handleSymmetryToggle = (mode: SymmetryMode) => {
    if (symmetryMode === mode) {
      setSymmetryMode('none');
    } else if (symmetryMode === 'none') {
      setSymmetryMode(mode);
    } else if (symmetryMode === 'horizontal' && mode === 'vertical') {
      setSymmetryMode('both');
    } else if (symmetryMode === 'vertical' && mode === 'horizontal') {
      setSymmetryMode('both');
    } else if (symmetryMode === 'both') {
      setSymmetryMode(mode === 'horizontal' ? 'vertical' : 'horizontal');
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-[200px] border-r bg-muted/30 flex flex-col h-full overflow-hidden">
        {/* Tools Section */}
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">TOOLS</h3>
          <div className="grid grid-cols-3 gap-1">
            {tools.map((tool) => (
              <Tooltip key={tool.id}>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={activeTool === tool.id}
                    onPressedChange={() => setTool(tool.id)}
                    size="sm"
                    className="w-full h-10"
                  >
                    <tool.icon className="h-4 w-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{tool.label} ({tool.shortcut})</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Brush Settings Section */}
        {(showBrushSize || showBrushOpacity) && (
          <div className="p-3 border-b space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground">BRUSH</h3>

            {showBrushSize && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Size</Label>
                  <span className="text-xs text-muted-foreground">{brushSize}px</span>
                </div>
                <Slider
                  value={[brushSize]}
                  onValueChange={([v]) => setBrushSize(v!)}
                  min={1}
                  max={16}
                  step={1}
                />
              </div>
            )}

            {showBrushOpacity && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Opacity</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(brushOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[brushOpacity * 100]}
                  onValueChange={([v]) => setBrushOpacity(v! / 100)}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            )}
          </div>
        )}

        {/* Symmetry Section */}
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">SYMMETRY</h3>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={symmetryMode === 'horizontal' || symmetryMode === 'both'}
                  onPressedChange={() => handleSymmetryToggle('horizontal')}
                  size="sm"
                  className="flex-1"
                >
                  <FlipHorizontal className="h-4 w-4 mr-1" />
                  <span className="text-xs">H</span>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Horizontal Symmetry</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={symmetryMode === 'vertical' || symmetryMode === 'both'}
                  onPressedChange={() => handleSymmetryToggle('vertical')}
                  size="sm"
                  className="flex-1"
                >
                  <FlipVertical className="h-4 w-4 mr-1" />
                  <span className="text-xs">V</span>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Vertical Symmetry</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* View Options Section */}
        <div className="p-3 border-b">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">VIEW</h3>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={showGrid}
                  onPressedChange={setShowGrid}
                  size="sm"
                  className="flex-1"
                >
                  <Grid3X3 className="h-4 w-4 mr-1" />
                  <span className="text-xs">Grid</span>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Show Grid</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={showOverlay}
                  onPressedChange={setShowOverlay}
                  size="sm"
                  className="flex-1"
                >
                  <Layers className="h-4 w-4 mr-1" />
                  <span className="text-xs">Parts</span>
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>Show Body Parts Overlay</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* History Section */}
        <div className="p-3 border-t">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2">HISTORY</h3>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={undo}
                  disabled={!historyState.canUndo}
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
                {historyState.undoDescription && (
                  <p className="text-muted-foreground text-xs">{historyState.undoDescription}</p>
                )}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={redo}
                  disabled={!historyState.canRedo}
                >
                  <Redo2 className="h-4 w-4 mr-1" />
                  Redo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
                {historyState.redoDescription && (
                  <p className="text-muted-foreground text-xs">{historyState.redoDescription}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
