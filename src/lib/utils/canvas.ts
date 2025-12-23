import type { RGBA } from '../core/types';

/**
 * Fast pixel manipulation using 32-bit typed arrays
 * Optimized for performance in real-time editing
 */
export class FastImageData {
  private data: Uint8ClampedArray;
  private data32: Uint32Array;
  readonly width: number;
  readonly height: number;

  constructor(imageData: ImageData) {
    this.data = imageData.data;
    this.data32 = new Uint32Array(imageData.data.buffer);
    this.width = imageData.width;
    this.height = imageData.height;
  }

  /** Get pixel as RGBA tuple */
  getPixel(x: number, y: number): RGBA {
    const idx = (y * this.width + x) * 4;
    return [
      this.data[idx]!,
      this.data[idx + 1]!,
      this.data[idx + 2]!,
      this.data[idx + 3]!,
    ];
  }

  /** Set pixel from RGBA tuple */
  setPixel(x: number, y: number, color: RGBA): void {
    const idx = (y * this.width + x) * 4;
    this.data[idx] = color[0];
    this.data[idx + 1] = color[1];
    this.data[idx + 2] = color[2];
    this.data[idx + 3] = color[3];
  }

  /** Fast set pixel using 32-bit write (ABGR format on little-endian) */
  setPixelFast(x: number, y: number, r: number, g: number, b: number, a: number): void {
    const idx = y * this.width + x;
    // Pack RGBA into 32-bit value (ABGR on little-endian systems)
    this.data32[idx] = (a << 24) | (b << 16) | (g << 8) | r;
  }

  /** Bulk fill rectangle */
  fillRect(x: number, y: number, w: number, h: number, color: RGBA): void {
    const packedColor = (color[3] << 24) | (color[2] << 16) | (color[1] << 8) | color[0];

    for (let py = y; py < y + h && py < this.height; py++) {
      for (let px = x; px < x + w && px < this.width; px++) {
        if (px >= 0 && py >= 0) {
          this.data32[py * this.width + px] = packedColor;
        }
      }
    }
  }

  /** Clear entire image */
  clear(): void {
    this.data32.fill(0);
  }

  /** Check if pixel is within bounds */
  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /** Get raw ImageData for putImageData */
  toImageData(): ImageData {
    return new ImageData(this.data, this.width, this.height);
  }

  /** Create from existing ImageData (clones the data) */
  static fromImageData(imageData: ImageData): FastImageData {
    const cloned = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    return new FastImageData(cloned);
  }

  /** Create empty with dimensions */
  static create(width: number, height: number): FastImageData {
    return new FastImageData(new ImageData(width, height));
  }
}

/** Convert ImageData to canvas */
export function imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/** Create ImageData from canvas */
export function canvasToImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d')!;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
