import type { RGBA } from '../core/types';

/**
 * Blend two colors using alpha compositing
 */
export function blendColors(base: RGBA, overlay: RGBA, opacity = 1): RGBA {
  const overlayAlpha = (overlay[3] / 255) * opacity;
  const baseAlpha = base[3] / 255;
  const outAlpha = overlayAlpha + baseAlpha * (1 - overlayAlpha);

  if (outAlpha === 0) {
    return [0, 0, 0, 0];
  }

  return [
    Math.round((overlay[0] * overlayAlpha + base[0] * baseAlpha * (1 - overlayAlpha)) / outAlpha),
    Math.round((overlay[1] * overlayAlpha + base[1] * baseAlpha * (1 - overlayAlpha)) / outAlpha),
    Math.round((overlay[2] * overlayAlpha + base[2] * baseAlpha * (1 - overlayAlpha)) / outAlpha),
    Math.round(outAlpha * 255),
  ];
}

/**
 * Erase by reducing alpha (for eraser tool)
 */
export function eraseColor(base: RGBA, strength = 1): RGBA {
  const newAlpha = Math.max(0, base[3] - Math.round(255 * strength));
  if (newAlpha === 0) {
    return [0, 0, 0, 0];
  }
  return [base[0], base[1], base[2], newAlpha];
}

/**
 * Compare two colors for equality
 */
export function colorsEqual(a: RGBA, b: RGBA, tolerance = 0): boolean {
  return (
    Math.abs(a[0] - b[0]) <= tolerance &&
    Math.abs(a[1] - b[1]) <= tolerance &&
    Math.abs(a[2] - b[2]) <= tolerance &&
    Math.abs(a[3] - b[3]) <= tolerance
  );
}

/**
 * Convert RGBA to hex string
 */
export function rgbaToHex(color: RGBA): string {
  const r = color[0].toString(16).padStart(2, '0');
  const g = color[1].toString(16).padStart(2, '0');
  const b = color[2].toString(16).padStart(2, '0');
  const a = color[3].toString(16).padStart(2, '0');
  return `#${r}${g}${b}${a}`;
}

/**
 * Convert hex string to RGBA
 */
export function hexToRgba(hex: string): RGBA {
  const h = hex.replace('#', '');

  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      255,
    ];
  }

  if (h.length === 8) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      parseInt(h.slice(6, 8), 16),
    ];
  }

  if (h.length === 3) {
    return [
      parseInt(h[0]! + h[0], 16),
      parseInt(h[1]! + h[1], 16),
      parseInt(h[2]! + h[2], 16),
      255,
    ];
  }

  return [0, 0, 0, 255];
}

/**
 * Convert RGBA to CSS string
 */
export function rgbaToCss(color: RGBA): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 255})`;
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h, s, l];
}

/**
 * Adjust brightness of a color
 */
export function adjustBrightness(color: RGBA, amount: number): RGBA {
  return [
    Math.max(0, Math.min(255, color[0] + amount)),
    Math.max(0, Math.min(255, color[1] + amount)),
    Math.max(0, Math.min(255, color[2] + amount)),
    color[3],
  ];
}

/**
 * Adjust saturation of a color
 */
export function adjustSaturation(color: RGBA, amount: number): RGBA {
  const [h, s, l] = rgbToHsl(color[0], color[1], color[2]);
  const newS = Math.max(0, Math.min(1, s + amount));
  const [r, g, b] = hslToRgb(h, newS, l);
  return [r, g, b, color[3]];
}

/**
 * Invert a color
 */
export function invertColor(color: RGBA): RGBA {
  return [255 - color[0], 255 - color[1], 255 - color[2], color[3]];
}

/**
 * Generate gradient colors between two colors
 */
export function gradientColors(from: RGBA, to: RGBA, steps: number): RGBA[] {
  const colors: RGBA[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    colors.push([
      Math.round(from[0] + (to[0] - from[0]) * t),
      Math.round(from[1] + (to[1] - from[1]) * t),
      Math.round(from[2] + (to[2] - from[2]) * t),
      Math.round(from[3] + (to[3] - from[3]) * t),
    ]);
  }

  return colors;
}

/**
 * Convert RGBA to HSL (returns h: 0-360, s: 0-100, l: 0-100)
 */
export function rgbaToHsl(color: RGBA): [number, number, number] {
  const [h, s, l] = rgbToHsl(color[0], color[1], color[2]);
  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGBA (expects h: 0-360, s: 0-100, l: 0-100)
 */
export function hslToRgba(h: number, s: number, l: number): RGBA {
  const [r, g, b] = hslToRgb(h / 360, s / 100, l / 100);
  return [r, g, b, 255];
}
