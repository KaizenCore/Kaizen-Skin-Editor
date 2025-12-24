import { ArrowLeftRight, Eye, EyeOff, PanelRightClose, PanelRightOpen, Layers as LayersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEditorStore } from '@/stores/editorStore';
import { rgbaToCss } from '@/lib/utils/color';
import { LayerPanel } from '@/components/layers/LayerPanel';
import { ColorPicker } from './ColorPicker';
import { SkinInfoPanel } from './SkinInfoPanel';
import type { BodyPartName } from '@/lib/core/types';

// Body part display config
const BODY_PARTS: { id: BodyPartName; label: string }[] = [
  { id: 'head', label: 'Head' },
  { id: 'body', label: 'Body' },
  { id: 'rightArm', label: 'Right Arm' },
  { id: 'leftArm', label: 'Left Arm' },
  { id: 'rightLeg', label: 'Right Leg' },
  { id: 'leftLeg', label: 'Left Leg' },
];

interface RightSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function RightSidebar({ collapsed, onToggleCollapse }: RightSidebarProps) {
  const {
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor,
    swapColors,
    paintTarget,
    setPaintTarget,
    bodyPartVisibility,
    toggleBodyPartVisibility,
    setAllBodyPartsVisible,
  } = useEditorStore();

  // Collapsed view
  if (collapsed) {
    return (
      <TooltipProvider delayDuration={300}>
        <div className="w-12 border-l bg-muted/30 flex flex-col h-full overflow-hidden">
          {/* Expand button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-full h-10 rounded-none"
                onClick={onToggleCollapse}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Expand sidebar</TooltipContent>
          </Tooltip>

          <div className="border-b" />

          {/* Colors - compact */}
          <div className="flex flex-col gap-1 p-1">
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full h-9 rounded border border-white/20 cursor-pointer hover:border-white/40 transition-colors"
                      style={{ backgroundColor: rgbaToCss(primaryColor) }}
                    />
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">Primary Color</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-72" side="left" align="start">
                <ColorPicker
                  color={primaryColor}
                  onChange={setPrimaryColor}
                  label="Primary Color"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      className="w-full h-9 rounded border border-white/20 cursor-pointer hover:border-white/40 transition-colors"
                      style={{ backgroundColor: rgbaToCss(secondaryColor) }}
                    />
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="left">Secondary Color</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-72" side="left" align="start">
                <ColorPicker
                  color={secondaryColor}
                  onChange={setSecondaryColor}
                  label="Secondary Color"
                />
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-7"
                  onClick={swapColors}
                >
                  <ArrowLeftRight className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Swap Colors (X)</TooltipContent>
            </Tooltip>
          </div>

          <div className="border-b" />

          {/* Paint Target - compact */}
          <div className="flex flex-col gap-1 p-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={paintTarget === 'base' ? 'default' : 'ghost'}
                  size="icon"
                  className="w-full h-8 text-[10px]"
                  onClick={() => setPaintTarget('base')}
                >
                  B
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Paint on Base layer</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={paintTarget === 'overlay' ? 'default' : 'ghost'}
                  size="icon"
                  className="w-full h-8 text-[10px]"
                  onClick={() => setPaintTarget('overlay')}
                >
                  O
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Paint on Overlay layer</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex-1" />

          {/* Layers indicator */}
          <div className="p-1 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-full h-8 flex items-center justify-center text-muted-foreground">
                  <LayersIcon className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">Expand to see layers</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-[280px] border-l bg-muted/30 flex flex-col h-full overflow-hidden">
        {/* Collapse button */}
        <div className="flex justify-start p-1 border-b">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onToggleCollapse}
              >
                <PanelRightClose className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Collapse sidebar</TooltipContent>
          </Tooltip>
        </div>

        {/* Skin Info Panel (when loaded from gallery) */}
        <SkinInfoPanel />

        {/* Colors Section */}
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground">COLORS</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={swapColors}
              title="Swap Colors (X)"
            >
              <ArrowLeftRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Primary Color */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-12 rounded border-2 border-white/20 shadow-md cursor-pointer hover:border-white/40 transition-colors relative"
                  style={{ backgroundColor: rgbaToCss(primaryColor) }}
                  title="Primary Color (Left Click)"
                >
                  <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white/70 bg-black/30 px-1 rounded">
                    Primary
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72" side="left" align="start">
                <ColorPicker
                  color={primaryColor}
                  onChange={setPrimaryColor}
                  label="Primary Color"
                />
              </PopoverContent>
            </Popover>

            {/* Secondary Color */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="flex-1 h-12 rounded border-2 border-white/20 shadow-md cursor-pointer hover:border-white/40 transition-colors relative"
                  style={{ backgroundColor: rgbaToCss(secondaryColor) }}
                  title="Secondary Color (Right Click)"
                >
                  <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white/70 bg-black/30 px-1 rounded">
                    Secondary
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72" side="left" align="start">
                <ColorPicker
                  color={secondaryColor}
                  onChange={setSecondaryColor}
                  label="Secondary Color"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

      {/* Paint Target Section */}
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">PAINT TARGET</h3>
        <div className="flex gap-2">
          <Button
            variant={paintTarget === 'base' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setPaintTarget('base')}
          >
            Base
          </Button>
          <Button
            variant={paintTarget === 'overlay' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => setPaintTarget('overlay')}
          >
            Overlay
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {paintTarget === 'base'
            ? 'Paint on base layer (skin texture)'
            : 'Paint on overlay (hat, jacket, etc.)'}
        </p>
      </div>

      {/* Body Parts Section */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground">BODY PARTS</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setAllBodyPartsVisible(true)}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setAllBodyPartsVisible(false)}
            >
              None
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {BODY_PARTS.map(({ id, label }) => (
            <Toggle
              key={id}
              pressed={bodyPartVisibility[id]}
              onPressedChange={() => toggleBodyPartVisibility(id)}
              size="sm"
              className="justify-start text-xs h-7"
            >
              {bodyPartVisibility[id] ? (
                <Eye className="h-3 w-3 mr-1" />
              ) : (
                <EyeOff className="h-3 w-3 mr-1 opacity-50" />
              )}
              {label}
            </Toggle>
          ))}
        </div>
      </div>

      <Separator />

      {/* Layers Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 pb-0">
          <h3 className="text-xs font-semibold text-muted-foreground">LAYERS</h3>
        </div>
        <div className="flex-1 overflow-auto">
          <LayerPanel />
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
