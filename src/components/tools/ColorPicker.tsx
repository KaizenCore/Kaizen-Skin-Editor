import { useState, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/stores/editorStore';
import { rgbaToCss, rgbaToHex, hexToRgba } from '@/lib/utils/color';
import type { RGBA } from '@/lib/core/types';

interface ColorSquareProps {
  color: RGBA;
  onChange: (color: RGBA) => void;
  label: string;
}

function ColorSquare({ color, onChange, label }: ColorSquareProps) {
  const [hexInput, setHexInput] = useState(rgbaToHex(color).slice(0, 7));

  const handleHexChange = useCallback(
    (value: string) => {
      setHexInput(value);
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        const newColor = hexToRgba(value);
        newColor[3] = color[3]; // Preserve alpha
        onChange(newColor);
      }
    },
    [color, onChange]
  );

  const handleRgbChange = useCallback(
    (channel: 0 | 1 | 2 | 3, value: number) => {
      const newColor: RGBA = [...color];
      newColor[channel] = Math.max(0, Math.min(255, value));
      onChange(newColor);
      setHexInput(rgbaToHex(newColor).slice(0, 7));
    },
    [color, onChange]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-8 h-8 rounded border-2 border-white/20 shadow-md cursor-pointer hover:border-white/40 transition-colors"
          style={{ backgroundColor: rgbaToCss(color) }}
          title={label}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64" side="right">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div
              className="w-12 h-12 rounded border"
              style={{ backgroundColor: rgbaToCss(color) }}
            />
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-8 font-mono text-sm"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Red</Label>
                <span className="text-xs text-muted-foreground">{color[0]}</span>
              </div>
              <Slider
                value={[color[0]]}
                onValueChange={([v]) => handleRgbChange(0, v!)}
                max={255}
                step={1}
                className="[&_[role=slider]]:bg-red-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Green</Label>
                <span className="text-xs text-muted-foreground">{color[1]}</span>
              </div>
              <Slider
                value={[color[1]]}
                onValueChange={([v]) => handleRgbChange(1, v!)}
                max={255}
                step={1}
                className="[&_[role=slider]]:bg-green-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Blue</Label>
                <span className="text-xs text-muted-foreground">{color[2]}</span>
              </div>
              <Slider
                value={[color[2]]}
                onValueChange={([v]) => handleRgbChange(2, v!)}
                max={255}
                step={1}
                className="[&_[role=slider]]:bg-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Alpha</Label>
                <span className="text-xs text-muted-foreground">{color[3]}</span>
              </div>
              <Slider
                value={[color[3]]}
                onValueChange={([v]) => handleRgbChange(3, v!)}
                max={255}
                step={1}
              />
            </div>
          </div>

          {/* Preset colors */}
          <div className="space-y-1">
            <Label className="text-xs">Presets</Label>
            <div className="grid grid-cols-8 gap-1">
              {[
                '#000000', '#FFFFFF', '#FF0000', '#00FF00',
                '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
                '#808080', '#C0C0C0', '#800000', '#008000',
                '#000080', '#808000', '#800080', '#008080',
              ].map((hex) => (
                <button
                  key={hex}
                  className="w-6 h-6 rounded border border-white/10 hover:border-white/30"
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    const newColor = hexToRgba(hex);
                    newColor[3] = color[3];
                    onChange(newColor);
                    setHexInput(hex);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ColorPicker() {
  const { primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor, swapColors } =
    useEditorStore();

  return (
    <div className="flex flex-col items-center gap-2 p-2">
      <div className="relative w-14 h-14">
        {/* Secondary color (back) */}
        <div className="absolute bottom-0 right-0">
          <ColorSquare
            color={secondaryColor}
            onChange={setSecondaryColor}
            label="Secondary Color"
          />
        </div>

        {/* Primary color (front) */}
        <div className="absolute top-0 left-0">
          <ColorSquare
            color={primaryColor}
            onChange={setPrimaryColor}
            label="Primary Color"
          />
        </div>

        {/* Swap button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -bottom-1 -right-1 w-5 h-5 p-0"
          onClick={swapColors}
        >
          <ArrowLeftRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
