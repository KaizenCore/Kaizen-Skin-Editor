import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useEditorStore } from '@/stores/editorStore';

export function BrushSettings() {
  const { brushSize, brushOpacity, setBrushSize, setBrushOpacity, activeTool } = useEditorStore();

  // Only show for drawing tools
  const showBrushSettings = ['pencil', 'eraser', 'noise'].includes(activeTool);

  if (!showBrushSettings) return null;

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-2">
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

      <div className="space-y-2">
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
    </div>
  );
}
