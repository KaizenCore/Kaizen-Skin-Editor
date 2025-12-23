import type { Point, RGBA } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { pixelKey } from '../types';
import { BaseTool } from '../BaseTool';
import { isValidForPaintTarget, isInBounds } from '../PaintTargetValidator';
import { colorsEqual } from '../../utils/color';

/**
 * Fill (Flood Fill) tool - fills contiguous area with color
 */
export class FillTool extends BaseTool {
  readonly id = 'fill' as const;
  readonly name = 'Fill';
  readonly icon = 'PaintBucket';
  readonly shortcut = 'G';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = false;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = false;

  private readonly TOLERANCE = 10; // Color matching tolerance

  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    this.startStroke(point);

    const color = useSecondary ? context.secondaryColor : context.primaryColor;
    this.floodFill(point, color, context);

    this.endStroke();
    return this.createResult(true);
  }

  onMove(_point: Point, _context: ToolContext, _useSecondary: boolean): ToolResult {
    // Fill doesn't support dragging
    return this.createResult(false);
  }

  onEnd(_point: Point, _context: ToolContext): ToolResult {
    return this.createResult(true);
  }

  private floodFill(startPoint: Point, fillColor: RGBA, context: ToolContext): void {
    const { width, height, imageData, paintTarget } = context;

    // Check if start point is valid
    if (!isInBounds(startPoint.x, startPoint.y, width, height)) {
      return;
    }

    if (!isValidForPaintTarget(startPoint.x, startPoint.y, paintTarget)) {
      return;
    }

    // Get target color at start point
    const targetColor = this.getPixel(startPoint.x, startPoint.y, imageData);

    // Don't fill if target color is same as fill color
    if (colorsEqual(targetColor, fillColor, 0)) {
      return;
    }

    // Use scanline flood fill algorithm for better performance
    const visited = new Set<string>();
    const stack: Point[] = [startPoint];

    while (stack.length > 0) {
      const point = stack.pop()!;
      const key = pixelKey(point.x, point.y);

      // Skip if already visited
      if (visited.has(key)) continue;

      // Check bounds
      if (!isInBounds(point.x, point.y, width, height)) continue;

      // Check paint target
      if (!isValidForPaintTarget(point.x, point.y, paintTarget)) continue;

      // Check color match
      const currentColor = this.getPixel(point.x, point.y, imageData);
      if (!colorsEqual(currentColor, targetColor, this.TOLERANCE)) continue;

      // Mark as visited
      visited.add(key);

      // Paint this pixel
      this.paintAt(point, fillColor, context);

      // Add neighbors to stack
      stack.push({ x: point.x + 1, y: point.y });
      stack.push({ x: point.x - 1, y: point.y });
      stack.push({ x: point.x, y: point.y + 1 });
      stack.push({ x: point.x, y: point.y - 1 });
    }
  }
}
