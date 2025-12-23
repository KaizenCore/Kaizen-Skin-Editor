import { Eye, EyeOff } from 'lucide-react';
import { useEditorStore, type PaintTarget } from '@/stores/editorStore';
import type { BodyPartName } from '@/lib/core/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';

const BODY_PARTS: { name: BodyPartName; label: string }[] = [
  { name: 'head', label: 'Head' },
  { name: 'body', label: 'Body' },
  { name: 'rightArm', label: 'Right Arm' },
  { name: 'leftArm', label: 'Left Arm' },
  { name: 'rightLeg', label: 'Right Leg' },
  { name: 'leftLeg', label: 'Left Leg' },
];

export function BodyPartsPanel() {
  const {
    bodyPartVisibility,
    toggleBodyPartVisibility,
    setAllBodyPartsVisible,
    paintTarget,
    setPaintTarget,
  } = useEditorStore();

  const allVisible = Object.values(bodyPartVisibility).every(Boolean);
  const noneVisible = Object.values(bodyPartVisibility).every((v) => !v);

  return (
    <div className="p-3 space-y-4">
      {/* Paint Target Section */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">Paint Target</Label>
        <div className="flex gap-1">
          <Button
            variant={paintTarget === 'base' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setPaintTarget('base')}
          >
            Base
          </Button>
          <Button
            variant={paintTarget === 'overlay' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setPaintTarget('overlay')}
          >
            Overlay
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {paintTarget === 'base'
            ? 'Painting on base layer (skin)'
            : 'Painting on overlay layer (hat, jacket...)'}
        </p>
      </div>

      <Separator />

      {/* Body Parts Visibility Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">Body Parts</Label>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setAllBodyPartsVisible(true)}
              disabled={allVisible}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setAllBodyPartsVisible(false)}
              disabled={noneVisible}
            >
              None
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          {BODY_PARTS.map(({ name, label }) => (
            <button
              key={name}
              onClick={() => toggleBodyPartVisibility(name)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                'hover:bg-accent',
                bodyPartVisibility[name] ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {bodyPartVisibility[name] ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="flex-1 text-left text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
