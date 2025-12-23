import type { Point, RGBA, Pixel, ToolId } from '../core/types/skin';
import type { Tool, ToolContext, ToolResult, ToolState } from './types';
import { createToolState, pixelKey } from './types';
import { filterPointsByPaintTarget, isInBounds } from './PaintTargetValidator';
import { getBrushPoints, applySymmetry, bresenhamLine } from '../utils/geometry';
import { blendColors, eraseColor } from '../utils/color';

/**
 * Abstract base class for all tools
 * Provides common functionality for brush handling, symmetry, paint target validation
 */
export abstract class BaseTool implements Tool {
  // Metadata - must be overridden by subclasses
  abstract readonly id: ToolId;
  abstract readonly name: string;
  abstract readonly icon: string;
  abstract readonly shortcut: string;
  abstract readonly cursor: string;
  abstract readonly usesBrushSize: boolean;
  abstract readonly usesBrushOpacity: boolean;
  abstract readonly usesSymmetry: boolean;

  // Internal state
  protected state: ToolState;
  protected lastPoint: Point | null = null;

  constructor() {
    this.state = createToolState();
  }

  // Abstract methods to be implemented by subclasses
  abstract onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult;
  abstract onMove(point: Point, context: ToolContext, useSecondary: boolean): ToolResult;
  abstract onEnd(point: Point, context: ToolContext): ToolResult;

  getState(): ToolState {
    return this.state;
  }

  getPreview(): Pixel[] {
    return this.state.previewPixels || [];
  }

  reset(): void {
    this.state = createToolState();
    this.lastPoint = null;
  }

  // =============== PROTECTED HELPER METHODS ===============

  /**
   * Get all brush points for a given center point, applying symmetry
   */
  protected getBrushPointsWithSymmetry(
    point: Point,
    context: ToolContext
  ): Point[] {
    // Get base brush points
    const brushPoints = this.usesBrushSize
      ? getBrushPoints(point, context.brushSize)
      : [point];

    // Apply symmetry if tool supports it
    if (!this.usesSymmetry || context.symmetryMode === 'none') {
      return brushPoints;
    }

    // For each brush point, apply symmetry
    const allPoints: Point[] = [];
    for (const bp of brushPoints) {
      const symPoints = applySymmetry(
        bp,
        context.symmetryMode,
        context.width,
        context.height
      );
      allPoints.push(...symPoints);
    }

    return allPoints;
  }

  /**
   * Filter points by paint target (base/overlay UV regions)
   */
  protected filterByPaintTarget(points: Point[], context: ToolContext): Point[] {
    return filterPointsByPaintTarget(points, context.paintTarget);
  }

  /**
   * Filter points to only those within bounds
   */
  protected filterByBounds(points: Point[], context: ToolContext): Point[] {
    return points.filter(p => isInBounds(p.x, p.y, context.width, context.height));
  }

  /**
   * Get all valid points for painting (with bounds and paint target filtering)
   */
  protected getValidPoints(point: Point, context: ToolContext): Point[] {
    let points = this.getBrushPointsWithSymmetry(point, context);
    points = this.filterByBounds(points, context);
    points = this.filterByPaintTarget(points, context);
    return points;
  }

  /**
   * Interpolate points between last and current point using Bresenham
   */
  protected interpolatePoints(from: Point, to: Point): Point[] {
    return bresenhamLine(from.x, from.y, to.x, to.y);
  }

  /**
   * Get pixel color from image data
   */
  protected getPixel(x: number, y: number, imageData: ImageData): RGBA {
    const idx = (y * imageData.width + x) * 4;
    return [
      imageData.data[idx]!,
      imageData.data[idx + 1]!,
      imageData.data[idx + 2]!,
      imageData.data[idx + 3]!,
    ];
  }

  /**
   * Set pixel color in image data
   */
  protected setPixel(x: number, y: number, color: RGBA, imageData: ImageData): void {
    const idx = (y * imageData.width + x) * 4;
    imageData.data[idx] = color[0];
    imageData.data[idx + 1] = color[1];
    imageData.data[idx + 2] = color[2];
    imageData.data[idx + 3] = color[3];
  }

  /**
   * Paint at a point with color blending
   */
  protected paintAt(
    point: Point,
    color: RGBA,
    context: ToolContext
  ): { original: Pixel | null; changed: Pixel | null } {
    const { x, y } = point;
    const key = pixelKey(x, y);

    // Get original color (only if not already tracked)
    let original: Pixel | null = null;
    if (!this.state.originalPixels.has(key)) {
      const originalColor = this.getPixel(x, y, context.imageData);
      original = { x, y, color: originalColor };
      this.state.originalPixels.set(key, original);
    }

    // Blend color with existing
    const existingColor = this.getPixel(x, y, context.imageData);
    const newColor = blendColors(existingColor, color, context.brushOpacity);

    // Set new color
    this.setPixel(x, y, newColor, context.imageData);

    // Track change
    const changed: Pixel = { x, y, color: newColor };
    this.state.changedPixels.set(key, changed);

    return { original, changed };
  }

  /**
   * Erase at a point
   */
  protected eraseAt(
    point: Point,
    context: ToolContext
  ): { original: Pixel | null; changed: Pixel | null } {
    const { x, y } = point;
    const key = pixelKey(x, y);

    // Get original color (only if not already tracked)
    let original: Pixel | null = null;
    if (!this.state.originalPixels.has(key)) {
      const originalColor = this.getPixel(x, y, context.imageData);
      original = { x, y, color: originalColor };
      this.state.originalPixels.set(key, original);
    }

    // Erase (reduce alpha)
    const existingColor = this.getPixel(x, y, context.imageData);
    const newColor = eraseColor(existingColor, context.brushOpacity);

    // Set new color
    this.setPixel(x, y, newColor, context.imageData);

    // Track change
    const changed: Pixel = { x, y, color: newColor };
    this.state.changedPixels.set(key, changed);

    return { original, changed };
  }

  /**
   * Create a result from current state
   */
  protected createResult(isComplete: boolean): ToolResult {
    return {
      changedPixels: Array.from(this.state.changedPixels.values()),
      originalPixels: Array.from(this.state.originalPixels.values()),
      isComplete,
      previewPixels: this.state.previewPixels,
    };
  }

  /**
   * Start a new stroke
   */
  protected startStroke(point: Point): void {
    this.state.isActive = true;
    this.state.startPoint = point;
    this.state.currentPoint = point;
    this.state.changedPixels.clear();
    this.state.originalPixels.clear();
    this.lastPoint = point;
  }

  /**
   * End current stroke
   */
  protected endStroke(): void {
    this.state.isActive = false;
    this.lastPoint = null;
  }
}
