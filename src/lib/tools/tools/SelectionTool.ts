import type { Point, Pixel, Rect, Selection } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';

/**
 * Selection tool - creates rectangular selections
 */
export class SelectionTool extends BaseTool {
  readonly id = 'selection' as const;
  readonly name = 'Selection';
  readonly icon = 'Square';
  readonly shortcut = 'M';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = false;
  readonly usesBrushOpacity = false;
  readonly usesSymmetry = false;

  private selectionBounds: Rect | null = null;

  onStart(point: Point, _context: ToolContext, _useSecondary: boolean): ToolResult {
    this.startStroke(point);

    // Initialize selection bounds
    this.selectionBounds = {
      x: point.x,
      y: point.y,
      width: 0,
      height: 0,
    };

    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: false,
      previewPixels: this.getSelectionPreview(),
    };
  }

  onMove(point: Point, _context: ToolContext, _useSecondary: boolean): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      return this.createResult(false);
    }

    this.state.currentPoint = point;

    // Update selection bounds
    this.selectionBounds = this.calculateBounds(this.state.startPoint, point);

    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: false,
      previewPixels: this.getSelectionPreview(),
    };
  }

  onEnd(point: Point, _context: ToolContext): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      this.endStroke();
      return {
        ...this.createResult(true),
        selection: null,
      };
    }

    // Finalize selection bounds
    this.selectionBounds = this.calculateBounds(this.state.startPoint, point);

    // Create selection object to return
    const selection: Selection | null = this.selectionBounds &&
      this.selectionBounds.width > 0 &&
      this.selectionBounds.height > 0
        ? {
            type: 'rectangle',
            bounds: { ...this.selectionBounds },
          }
        : null;

    this.endStroke();

    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: true,
      previewPixels: this.getSelectionPreview(),
      selection,
    };
  }

  /**
   * Get the current selection bounds
   */
  getSelectionBounds(): Rect | null {
    return this.selectionBounds;
  }

  /**
   * Clear the selection
   */
  clearSelection(): void {
    this.selectionBounds = null;
    this.state.previewPixels = [];
  }

  /**
   * Check if a point is inside the selection
   */
  isPointInSelection(point: Point): boolean {
    if (!this.selectionBounds) return false;

    return (
      point.x >= this.selectionBounds.x &&
      point.x < this.selectionBounds.x + this.selectionBounds.width &&
      point.y >= this.selectionBounds.y &&
      point.y < this.selectionBounds.y + this.selectionBounds.height
    );
  }

  private calculateBounds(start: Point, end: Point): Rect {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x) + 1;
    const height = Math.abs(end.y - start.y) + 1;

    return { x, y, width, height };
  }

  private getSelectionPreview(): Pixel[] {
    if (!this.selectionBounds) return [];

    const { x, y, width, height } = this.selectionBounds;
    const pixels: Pixel[] = [];

    // Selection outline color (marching ants effect handled by renderer)
    const outlineColor: [number, number, number, number] = [0, 120, 255, 200];

    // Top edge
    for (let i = x; i < x + width; i++) {
      pixels.push({ x: i, y, color: outlineColor });
    }

    // Bottom edge
    for (let i = x; i < x + width; i++) {
      pixels.push({ x: i, y: y + height - 1, color: outlineColor });
    }

    // Left edge
    for (let j = y + 1; j < y + height - 1; j++) {
      pixels.push({ x, y: j, color: outlineColor });
    }

    // Right edge
    for (let j = y + 1; j < y + height - 1; j++) {
      pixels.push({ x: x + width - 1, y: j, color: outlineColor });
    }

    return pixels;
  }
}
