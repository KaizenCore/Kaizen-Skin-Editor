import { Eye, EyeOff, Plus, Trash2, Copy, ChevronUp, ChevronDown, Merge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useEditorStore } from '@/stores/editorStore';
import { cn } from '@/lib/cn';

export function LayerPanel() {
  const {
    document,
    setActiveLayer,
    addLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
    setLayerVisibility,
    setLayerOpacity,
    mergeDown,
    flattenLayers,
  } = useEditorStore();

  if (!document) return null;

  const layers = [...document.layers].reverse(); // Display top to bottom

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="text-sm font-medium">Layers</span>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addLayer()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add Layer</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={flattenLayers}
                  disabled={document.layers.length <= 1}
                >
                  <Merge className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Flatten All</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Layer list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {layers.map((layer, displayIndex) => {
              const isActive = layer.id === document.activeLayerId;
              const actualIndex = document.layers.length - 1 - displayIndex;
              const canMoveUp = actualIndex < document.layers.length - 1;
              const canMoveDown = actualIndex > 0;
              const canMergeDown = actualIndex > 0;

              return (
                <div
                  key={layer.id}
                  className={cn(
                    'group rounded-md border p-2 cursor-pointer transition-colors',
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent hover:bg-muted/50'
                  )}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  <div className="flex items-center gap-2">
                    {/* Visibility toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLayerVisibility(layer.id, !layer.visible);
                      }}
                    >
                      {layer.visible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3 opacity-50" />
                      )}
                    </Button>

                    {/* Layer name */}
                    <span className="flex-1 text-sm truncate">{layer.name}</span>

                    {/* Layer actions (visible on hover) */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayer(layer.id, 'up');
                            }}
                            disabled={!canMoveUp}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move Up</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveLayer(layer.id, 'down');
                            }}
                            disabled={!canMoveDown}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move Down</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLayer(layer.id);
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              mergeDown(layer.id);
                            }}
                            disabled={!canMergeDown}
                          >
                            <Merge className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Merge Down</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            disabled={document.layers.length <= 1}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Opacity slider (visible when active) */}
                  {isActive && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                      <Slider
                        value={[layer.opacity * 100]}
                        onValueChange={([v]) => setLayerOpacity(layer.id, v! / 100)}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
