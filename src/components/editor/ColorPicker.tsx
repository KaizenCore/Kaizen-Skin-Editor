import { useState, useCallback, useEffect, useRef } from 'react';
import { Star, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { rgbaToCss, rgbaToHex, hexToRgba, rgbaToHsl, hslToRgba } from '@/lib/utils/color';
import type { RGBA } from '@/lib/core/types';

// Color palettes for Minecraft skin editing
const PALETTES = {
  'Skin Tones': [
    '#FFE0BD', '#FFCD94', '#EAC086', '#FFAD60', '#E5A073',
    '#C68642', '#8D5524', '#6B4423', '#4A2912', '#3B1E0E',
    '#FFF0E6', '#FFE4D6', '#DFC2A0', '#C4956A', '#A67B4F',
  ],
  'Hair Colors': [
    '#090806', '#2C222B', '#3B3024', '#4E433F', '#504444',
    '#6A4E42', '#A7856A', '#B89778', '#DCD0BA', '#E5C8A8',
    '#DEBC99', '#B55239', '#8D4A43', '#91553D', '#533D32',
  ],
  'Eye Colors': [
    '#634E34', '#497665', '#3D671D', '#1C7847', '#2E536F',
    '#3D5A80', '#497AA0', '#77B5FE', '#8B7355', '#A0785A',
    '#1B1B1B', '#36454F', '#708090', '#778899', '#B0C4DE',
  ],
  'Clothing': [
    '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E',
    '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
    '#FF0000', '#FF4444', '#FF6B6B', '#E74C3C', '#C0392B',
    '#0000FF', '#3498DB', '#2980B9', '#1ABC9C', '#16A085',
    '#00FF00', '#2ECC71', '#27AE60', '#1E8449', '#145A32',
    '#FFFF00', '#F1C40F', '#F39C12', '#E67E22', '#D35400',
    '#FF00FF', '#9B59B6', '#8E44AD', '#6C3483', '#4A235A',
  ],
  'Basic': [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#C0C0C0',
    '#800000', '#008000', '#000080', '#808000', '#800080',
    '#008080', '#FFA500', '#FFC0CB', '#A52A2A', '#FFD700',
  ],
};

const STORAGE_KEY_FAVORITES = 'skineditor-favorite-colors';
const STORAGE_KEY_RECENT = 'skineditor-recent-colors';
const MAX_RECENT = 16;
const MAX_FAVORITES = 32;

// Load from localStorage
function loadColors(key: string): string[] {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Save to localStorage
function saveColors(key: string, colors: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(colors));
  } catch {
    // Ignore storage errors
  }
}

interface ColorSpectrumProps {
  hue: number;
  saturation: number;
  lightness: number;
  onChange: (s: number, l: number) => void;
}

function ColorSpectrum({ hue, saturation, lightness, onChange }: ColorSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Draw the spectrum
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;

    // Create gradient for saturation (horizontal) and lightness (vertical)
    for (let y = 0; y < height; y++) {
      const l = 100 - (y / height) * 100;
      for (let x = 0; x < width; x++) {
        const s = (x / width) * 100;
        const rgb = hslToRgba(hue, s, l);
        ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [hue]);

  const handlePointer = useCallback(
    (e: React.PointerEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      onChange(x * 100, 100 - y * 100);
    },
    [onChange]
  );

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        className="w-full h-[120px] rounded cursor-crosshair border border-white/20"
        onPointerDown={(e) => {
          setIsDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          handlePointer(e);
        }}
        onPointerMove={(e) => isDragging && handlePointer(e)}
        onPointerUp={() => setIsDragging(false)}
      />
      {/* Cursor indicator */}
      <div
        className="absolute w-4 h-4 border-2 border-white rounded-full pointer-events-none shadow-md"
        style={{
          left: `${saturation}%`,
          top: `${100 - lightness}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        }}
      />
    </div>
  );
}

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

function HueSlider({ hue, onChange }: HueSliderProps) {
  return (
    <div
      className="h-4 rounded cursor-pointer relative"
      style={{
        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        onChange(x * 360);
      }}
    >
      <div
        className="absolute top-0 w-2 h-full bg-white border border-black/30 rounded"
        style={{ left: `${(hue / 360) * 100}%`, transform: 'translateX(-50%)' }}
      />
    </div>
  );
}

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick: () => void;
  onRightClick?: () => void;
  size?: 'sm' | 'md';
  showRemove?: boolean;
}

function ColorSwatch({ color, selected, onClick, onRightClick, size = 'sm', showRemove }: ColorSwatchProps) {
  const sizeClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <button
      className={`${sizeClass} rounded border-2 transition-all relative group ${
        selected ? 'border-white scale-110 shadow-lg' : 'border-white/20 hover:border-white/50'
      }`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onRightClick?.();
      }}
      title={color}
    >
      {showRemove && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full hidden group-hover:flex items-center justify-center">
          <X className="w-2 h-2 text-white" />
        </div>
      )}
    </button>
  );
}

interface ColorPickerProps {
  color: RGBA;
  onChange: (color: RGBA) => void;
  label?: string;
}

export function ColorPicker({ color, onChange, label }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(rgbaToHex(color).slice(0, 7));
  const [favorites, setFavorites] = useState<string[]>(() => loadColors(STORAGE_KEY_FAVORITES));
  const [recent, setRecent] = useState<string[]>(() => loadColors(STORAGE_KEY_RECENT));
  const [expandedPalette, setExpandedPalette] = useState<string | null>('Skin Tones');

  // Convert to HSL for the picker
  const [h, s, l] = rgbaToHsl(color);

  // Update hex input when color changes externally
  useEffect(() => {
    setHexInput(rgbaToHex(color).slice(0, 7));
  }, [color]);

  const handleHexChange = useCallback(
    (value: string) => {
      setHexInput(value);
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        const newColor = hexToRgba(value);
        newColor[3] = color[3];
        onChange(newColor);
      }
    },
    [color, onChange]
  );

  const handleColorSelect = useCallback(
    (hex: string) => {
      const newColor = hexToRgba(hex);
      newColor[3] = color[3];
      onChange(newColor);
      setHexInput(hex);

      // Add to recent
      setRecent((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== hex.toLowerCase());
        const updated = [hex, ...filtered].slice(0, MAX_RECENT);
        saveColors(STORAGE_KEY_RECENT, updated);
        return updated;
      });
    },
    [color, onChange]
  );

  const handleHslChange = useCallback(
    (newH: number, newS: number, newL: number) => {
      const rgba = hslToRgba(newH, newS, newL);
      rgba[3] = color[3];
      onChange(rgba);
      setHexInput(rgbaToHex(rgba).slice(0, 7));
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

  const addToFavorites = useCallback(() => {
    const hex = rgbaToHex(color).slice(0, 7);
    if (favorites.includes(hex)) return;

    setFavorites((prev) => {
      const updated = [...prev, hex].slice(-MAX_FAVORITES);
      saveColors(STORAGE_KEY_FAVORITES, updated);
      return updated;
    });
  }, [color, favorites]);

  const removeFromFavorites = useCallback((hex: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((c) => c !== hex);
      saveColors(STORAGE_KEY_FAVORITES, updated);
      return updated;
    });
  }, []);

  const currentHex = rgbaToHex(color).slice(0, 7);
  const isFavorite = favorites.includes(currentHex);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        {/* Current color preview + hex input */}
        <div className="flex items-center gap-2">
          <div
            className="w-12 h-12 rounded border-2 border-white/20 shadow-inner"
            style={{ backgroundColor: rgbaToCss(color) }}
          />
          <div className="flex-1 space-y-1">
            {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
            <div className="flex gap-1">
              <Input
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="h-7 font-mono text-xs flex-1"
                placeholder="#000000"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isFavorite ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7"
                    onClick={addToFavorites}
                  >
                    <Star className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to favorites</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Color spectrum */}
        <div className="space-y-2">
          <ColorSpectrum
            hue={h}
            saturation={s}
            lightness={l}
            onChange={(newS, newL) => handleHslChange(h, newS, newL)}
          />
          <HueSlider hue={h} onChange={(newH) => handleHslChange(newH, s, l)} />
        </div>

        {/* RGB/Alpha sliders */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'R', channel: 0 as const, color: 'bg-red-500' },
            { label: 'G', channel: 1 as const, color: 'bg-green-500' },
            { label: 'B', channel: 2 as const, color: 'bg-blue-500' },
            { label: 'A', channel: 3 as const, color: 'bg-gray-500' },
          ].map(({ label: sliderLabel, channel, color: sliderColor }) => (
            <div key={channel} className="flex items-center gap-1">
              <span className="text-[10px] w-3 text-muted-foreground">{sliderLabel}</span>
              <Slider
                value={[color[channel]]}
                onValueChange={([v]) => handleRgbChange(channel, v!)}
                max={255}
                step={1}
                className={`flex-1 [&_[role=slider]]:${sliderColor} [&_[role=slider]]:w-3 [&_[role=slider]]:h-3`}
              />
              <span className="text-[10px] w-6 text-right text-muted-foreground">{color[channel]}</span>
            </div>
          ))}
        </div>

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">FAVORITES</Label>
            <div className="flex flex-wrap gap-1">
              {favorites.map((hex) => (
                <ColorSwatch
                  key={hex}
                  color={hex}
                  selected={hex.toLowerCase() === currentHex.toLowerCase()}
                  onClick={() => handleColorSelect(hex)}
                  onRightClick={() => removeFromFavorites(hex)}
                  showRemove
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent colors */}
        {recent.length > 0 && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">RECENT</Label>
            <div className="flex flex-wrap gap-1">
              {recent.slice(0, 16).map((hex, i) => (
                <ColorSwatch
                  key={`${hex}-${i}`}
                  color={hex}
                  selected={hex.toLowerCase() === currentHex.toLowerCase()}
                  onClick={() => handleColorSelect(hex)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Palettes */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">PALETTES</Label>
          <ScrollArea className="h-[140px]">
            <div className="space-y-1 pr-2">
              {Object.entries(PALETTES).map(([name, colors]) => (
                <div key={name} className="border border-white/10 rounded">
                  <button
                    className="w-full flex items-center justify-between px-2 py-1 text-xs hover:bg-white/5"
                    onClick={() => setExpandedPalette(expandedPalette === name ? null : name)}
                  >
                    <span>{name}</span>
                    {expandedPalette === name ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  {expandedPalette === name && (
                    <div className="flex flex-wrap gap-1 p-2 pt-0">
                      {colors.map((hex) => (
                        <ColorSwatch
                          key={hex}
                          color={hex}
                          selected={hex.toLowerCase() === currentHex.toLowerCase()}
                          onClick={() => handleColorSelect(hex)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </TooltipProvider>
  );
}
