import type { Point, RGBA } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';
import { isInBounds, isBasePixel, isOverlayPixel } from '../PaintTargetValidator';
import { colorsEqual } from '../../utils/color';

/**
 * Color Replacement tool - replaces all pixels of a clicked color with another color
 * across the ENTIRE skin (all body parts, base and overlay).
 * Useful for quickly changing the color of elements like t-shirts, hair, etc.
 */
export class ColorReplacementTool extends BaseTool {
  readonly id = 'color-replacement' as const;
  readonly name = 'Color Replacement';
  readonly icon = 'Replace';
  readonly shortcut = 'R';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = false;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = false;

  private readonly TOLERANCE = 10; // Color matching tolerance

  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    this.startStroke(point);

    const targetColor = useSecondary ? context.secondaryColor : context.primaryColor;
    this.replaceColor(point, targetColor, context);

    this.endStroke();
    return this.createResult(true);
  }

  onMove(_point: Point, _context: ToolContext, _useSecondary: boolean): ToolResult {
    // Color replacement doesn't support dragging
    return this.createResult(false);
  }

  onEnd(_point: Point, _context: ToolContext): ToolResult {
    return this.createResult(true);
  }

  /**
   * Check if a pixel is in any valid UV region (base or overlay)
   */
  private isValidPixel(x: number, y: number): boolean {
    return isBasePixel(x, y) || isOverlayPixel(x, y);
  }

  /**
   * Replace all pixels matching the clicked color with the target color
   * Scans the ENTIRE skin texture, ignoring paintTarget restrictions
   */
  private replaceColor(startPoint: Point, targetColor: RGBA, context: ToolContext): void {
    const { width, height, imageData } = context;

    // Check if start point is valid
    if (!isInBounds(startPoint.x, startPoint.y, width, height)) {
      return;
    }

    // Start point must be in a valid UV region
    if (!this.isValidPixel(startPoint.x, startPoint.y)) {
      return;
    }

    // Get the source color at clicked point
    const sourceColor = this.getPixel(startPoint.x, startPoint.y, imageData);

    // Don't replace if source color is same as target color
    if (colorsEqual(sourceColor, targetColor, 0)) {
      return;
    }

    // Don't replace fully transparent pixels
    if (sourceColor[3] === 0) {
      return;
    }

    // Scan ENTIRE image for matching pixels (both base and overlay regions)
    const matchingPixels: Point[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Only check pixels in valid UV regions (base or overlay)
        if (!this.isValidPixel(x, y)) {
          continue;
        }

        // Check if pixel color matches source color
        const currentColor = this.getPixel(x, y, imageData);
        if (colorsEqual(currentColor, sourceColor, this.TOLERANCE)) {
          matchingPixels.push({ x, y });
        }
      }
    }

    // Replace all matching pixels
    for (const pixel of matchingPixels) {
      this.paintAt(pixel, targetColor, context);
    }
  }
}
