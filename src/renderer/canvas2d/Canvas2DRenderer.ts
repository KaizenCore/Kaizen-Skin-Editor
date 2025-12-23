import type { Layer, Point, Selection, BodyPartName } from '@/lib/core/types';
import { SKIN_UV_MAP } from '@/lib/core/constants';

export interface Canvas2DRendererOptions {
  canvas: HTMLCanvasElement;
  skinWidth?: number;
  skinHeight?: number;
}

/** Organized template regions for clear 2D display */
interface TemplateRegion {
  name: string;
  shortName: string;
  part: BodyPartName;
  layer: 'base' | 'overlay';
  face: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/** Color scheme for body parts */
const PART_COLORS: Record<BodyPartName, { base: string; overlay: string }> = {
  head: { base: 'rgba(239, 68, 68, 0.4)', overlay: 'rgba(239, 68, 68, 0.25)' },      // Red
  body: { base: 'rgba(34, 197, 94, 0.4)', overlay: 'rgba(34, 197, 94, 0.25)' },      // Green
  rightArm: { base: 'rgba(59, 130, 246, 0.4)', overlay: 'rgba(59, 130, 246, 0.25)' }, // Blue
  leftArm: { base: 'rgba(168, 85, 247, 0.4)', overlay: 'rgba(168, 85, 247, 0.25)' },  // Purple
  rightLeg: { base: 'rgba(249, 115, 22, 0.4)', overlay: 'rgba(249, 115, 22, 0.25)' }, // Orange
  leftLeg: { base: 'rgba(236, 72, 153, 0.4)', overlay: 'rgba(236, 72, 153, 0.25)' },  // Pink
};

/** Build organized template regions from UV map */
function buildTemplateRegions(): TemplateRegion[] {
  const regions: TemplateRegion[] = [];
  const faceNames = ['top', 'bottom', 'front', 'back', 'left', 'right'] as const;
  const faceLabels: Record<string, string> = {
    top: 'T', bottom: 'Bo', front: 'F', back: 'Ba', left: 'L', right: 'R'
  };

  for (const [partName, partUV] of Object.entries(SKIN_UV_MAP)) {
    const part = partName as BodyPartName;

    for (const layerType of ['base', 'overlay'] as const) {
      const layerUV = partUV[layerType];

      for (const face of faceNames) {
        const [x1, y1, x2, y2] = layerUV[face];
        regions.push({
          name: `${part} ${layerType} ${face}`,
          shortName: faceLabels[face]!,
          part,
          layer: layerType,
          face,
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1,
          color: PART_COLORS[part][layerType],
        });
      }
    }
  }

  return regions;
}

export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  private offscreenCtx: OffscreenCanvasRenderingContext2D;

  // Viewport state
  private _zoom = 8;
  private _panX = 0;
  private _panY = 0;

  // Settings
  private skinWidth: number;
  private skinHeight: number;
  private showGrid = true;
  private showOverlay = true;
  private showLabels = true;
  private highlightLayer: 'all' | 'base' | 'overlay' = 'all';

  // Cached template regions
  private templateRegions = buildTemplateRegions();

  constructor(options: Canvas2DRendererOptions) {
    this.canvas = options.canvas;
    this.skinWidth = options.skinWidth ?? 64;
    this.skinHeight = options.skinHeight ?? 64;

    this.ctx = this.canvas.getContext('2d', {
      willReadFrequently: true,
      alpha: true,
    })!;

    this.offscreenCanvas = new OffscreenCanvas(this.skinWidth, this.skinHeight);
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.offscreenCtx.imageSmoothingEnabled = false;
  }

  get zoom(): number {
    return this._zoom;
  }

  get panX(): number {
    return this._panX;
  }

  get panY(): number {
    return this._panY;
  }

  setZoom(zoom: number): void {
    this._zoom = Math.max(1, Math.min(32, zoom));
  }

  setPan(x: number, y: number): void {
    this._panX = x;
    this._panY = y;
  }

  setShowGrid(show: boolean): void {
    this.showGrid = show;
  }

  setShowOverlay(show: boolean): void {
    this.showOverlay = show;
  }

  setShowLabels(show: boolean): void {
    this.showLabels = show;
  }

  setHighlightLayer(layer: 'all' | 'base' | 'overlay'): void {
    this.highlightLayer = layer;
  }

  /** Render composite of all visible layers */
  render(layers: Layer[], selection?: Selection | null): void {
    // Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, this.skinWidth, this.skinHeight);

    // Composite layers from bottom to top
    for (const layer of layers) {
      if (!layer.visible) continue;

      this.offscreenCtx.globalAlpha = layer.opacity;
      this.offscreenCtx.globalCompositeOperation =
        layer.blendMode as GlobalCompositeOperation;

      // Draw layer via temporary canvas
      const tempCanvas = new OffscreenCanvas(this.skinWidth, this.skinHeight);
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(layer.imageData, 0, 0);
      this.offscreenCtx.drawImage(tempCanvas, 0, 0);
    }

    // Reset composite operation
    this.offscreenCtx.globalAlpha = 1;
    this.offscreenCtx.globalCompositeOperation = 'source-over';

    // Clear main canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw checkerboard background (transparency indicator)
    this.drawCheckerboard();

    // Apply transform and draw skin
    this.ctx.save();
    this.ctx.translate(this._panX, this._panY);
    this.ctx.scale(this._zoom, this._zoom);

    // Draw the composite
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);

    // Draw grid overlay
    if (this.showGrid && this._zoom >= 4) {
      this.drawGrid();
    }

    // Draw body part boundaries (UV regions)
    if (this.showOverlay) {
      this.drawBodyPartOverlay();
    }

    // Draw selection if present
    if (selection) {
      this.drawSelection(selection);
    }

    this.ctx.restore();
  }

  /** Convert screen coordinates to skin pixel coordinates */
  screenToSkin(screenX: number, screenY: number): Point | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    const skinX = Math.floor((x - this._panX) / this._zoom);
    const skinY = Math.floor((y - this._panY) / this._zoom);

    if (skinX < 0 || skinX >= this.skinWidth || skinY < 0 || skinY >= this.skinHeight) {
      return null;
    }

    return { x: skinX, y: skinY };
  }

  /** Convert skin pixel to screen coordinates */
  skinToScreen(skinX: number, skinY: number): Point {
    return {
      x: skinX * this._zoom + this._panX,
      y: skinY * this._zoom + this._panY,
    };
  }

  /** Get composited ImageData */
  getCompositeImageData(): ImageData {
    return this.offscreenCtx.getImageData(0, 0, this.skinWidth, this.skinHeight);
  }

  /** Center the view */
  centerView(): void {
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    const skinDisplayWidth = this.skinWidth * this._zoom;
    const skinDisplayHeight = this.skinHeight * this._zoom;

    this._panX = (canvasWidth - skinDisplayWidth) / 2;
    this._panY = (canvasHeight - skinDisplayHeight) / 2;
  }

  /** Resize canvas */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
  }

  private drawCheckerboard(): void {
    const size = 8;
    // Get colors from CSS variables (set by theme)
    const style = getComputedStyle(document.documentElement);
    const color1 = style.getPropertyValue('--viewer-2d-bg').trim() || '#312E21';
    const color2 = style.getPropertyValue('--viewer-2d-bg-alt').trim() || '#2a2719';
    const colors = [color1, color2];

    for (let y = 0; y < this.canvas.height; y += size) {
      for (let x = 0; x < this.canvas.width; x += size) {
        this.ctx.fillStyle = colors[((Math.floor(x / size) + Math.floor(y / size)) % 2)]!;
        this.ctx.fillRect(x, y, size, size);
      }
    }
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1 / this._zoom;

    // Vertical lines
    for (let x = 0; x <= this.skinWidth; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.skinHeight);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= this.skinHeight; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.skinWidth, y);
      this.ctx.stroke();
    }
  }

  private drawBodyPartOverlay(): void {
    // Draw section separators first (horizontal lines at y=16, 32, 48)
    this.drawSectionSeparators();

    // Group regions by layer for organized drawing
    const baseRegions = this.templateRegions.filter(r => r.layer === 'base');
    const overlayRegions = this.templateRegions.filter(r => r.layer === 'overlay');

    // Draw base layer regions
    if (this.highlightLayer === 'all' || this.highlightLayer === 'base') {
      this.drawRegionGroup(baseRegions, 'base');
    }

    // Draw overlay layer regions
    if (this.highlightLayer === 'all' || this.highlightLayer === 'overlay') {
      this.drawRegionGroup(overlayRegions, 'overlay');
    }

    // Draw section labels
    if (this.showLabels && this._zoom >= 4) {
      this.drawSectionLabels();
    }
  }

  private drawSectionSeparators(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 2 / this._zoom;
    this.ctx.setLineDash([4 / this._zoom, 2 / this._zoom]);

    // Horizontal separators
    [16, 32, 48].forEach(y => {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.skinWidth, y);
      this.ctx.stroke();
    });

    this.ctx.setLineDash([]);
  }

  private drawRegionGroup(regions: TemplateRegion[], layerType: 'base' | 'overlay'): void {
    const lineWidth = layerType === 'base' ? 2 / this._zoom : 1.5 / this._zoom;
    const lineDash = layerType === 'overlay' ? [2 / this._zoom, 2 / this._zoom] : [];

    for (const region of regions) {
      const { x, y, width, height, color } = region;

      // Fill with color
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);

      // Stroke outline
      this.ctx.strokeStyle = color.replace(/[\d.]+\)$/, '0.8)');
      this.ctx.lineWidth = lineWidth;
      this.ctx.setLineDash(lineDash);
      this.ctx.strokeRect(x + 0.5 / this._zoom, y + 0.5 / this._zoom, width - 1 / this._zoom, height - 1 / this._zoom);
    }

    this.ctx.setLineDash([]);
  }

  private drawSectionLabels(): void {
    // Part name labels with their approximate positions
    const partLabels: Array<{ label: string; x: number; y: number; layer: 'base' | 'overlay' }> = [
      // Row 1 (y=0-16): Head base & overlay
      { label: 'HEAD', x: 4, y: 4, layer: 'base' },
      { label: 'HEAD (overlay)', x: 36, y: 4, layer: 'overlay' },

      // Row 2 (y=16-32): Body, Right Arm, Right Leg base
      { label: 'LEG R', x: 0, y: 18, layer: 'base' },
      { label: 'BODY', x: 18, y: 18, layer: 'base' },
      { label: 'ARM R', x: 42, y: 18, layer: 'base' },

      // Row 3 (y=32-48): Body, Right Arm, Right Leg overlay
      { label: 'LEG R (o)', x: 0, y: 34, layer: 'overlay' },
      { label: 'BODY (o)', x: 18, y: 34, layer: 'overlay' },
      { label: 'ARM R (o)', x: 42, y: 34, layer: 'overlay' },

      // Row 4 (y=48-64): Left Leg, Left Arm base & overlay
      { label: 'LEG L (o)', x: 0, y: 50, layer: 'overlay' },
      { label: 'LEG L', x: 18, y: 50, layer: 'base' },
      { label: 'ARM L', x: 34, y: 50, layer: 'base' },
      { label: 'ARM L (o)', x: 50, y: 50, layer: 'overlay' },
    ];

    this.ctx.font = `bold ${Math.max(3, 10 / this._zoom)}px monospace`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    for (const { label, x, y, layer } of partLabels) {
      if (this.highlightLayer !== 'all' && this.highlightLayer !== layer) continue;

      // Text shadow for readability
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillText(label, x + 0.5 / this._zoom, y + 0.5 / this._zoom);

      // Text
      this.ctx.fillStyle = layer === 'base' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(200, 200, 200, 0.7)';
      this.ctx.fillText(label, x, y);
    }
  }

  private drawSelection(selection: Selection): void {
    const { bounds } = selection;

    // Animated marching ants
    const time = Date.now() / 100;
    const dashOffset = time % 16;

    this.ctx.save();
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1 / this._zoom;
    this.ctx.setLineDash([4 / this._zoom, 4 / this._zoom]);
    this.ctx.lineDashOffset = dashOffset / this._zoom;
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineDashOffset = (dashOffset + 4) / this._zoom;
    this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
    this.ctx.restore();
  }

  /** Render preview pixels (for tools like line, gradient) */
  renderPreview(pixels: Array<{ x: number; y: number; color: [number, number, number, number] }>): void {
    if (pixels.length === 0) return;

    this.ctx.save();
    this.ctx.translate(this._panX, this._panY);
    this.ctx.scale(this._zoom, this._zoom);

    for (const pixel of pixels) {
      const { x, y, color } = pixel;
      // Semi-transparent preview
      this.ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${(color[3] / 255) * 0.7})`;
      this.ctx.fillRect(x, y, 1, 1);
    }

    this.ctx.restore();
  }

  dispose(): void {
    // Cleanup if needed
  }
}
