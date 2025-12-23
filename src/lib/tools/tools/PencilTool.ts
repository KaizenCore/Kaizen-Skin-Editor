import type { Point, RGBA } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';

/**
 * Pencil tool - draws with color blending
 */
export class PencilTool extends BaseTool {
  readonly id = 'pencil' as const;
  readonly name = 'Pencil';
  readonly icon = 'Pencil';
  readonly shortcut = 'P';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = true;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = true;

  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    this.startStroke(point);

    const color = useSecondary ? context.secondaryColor : context.primaryColor;
    this.drawAtPoint(point, color, context);

    return this.createResult(false);
  }

  onMove(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    if (!this.state.isActive) {
      return this.createResult(false);
    }

    const color = useSecondary ? context.secondaryColor : context.primaryColor;

    // Interpolate from last point for smooth strokes
    if (this.lastPoint) {
      const interpolated = this.interpolatePoints(this.lastPoint, point);
      for (const p of interpolated) {
        this.drawAtPoint(p, color, context);
      }
    } else {
      this.drawAtPoint(point, color, context);
    }

    this.lastPoint = point;
    this.state.currentPoint = point;

    return this.createResult(false);
  }

  onEnd(_point: Point, _context: ToolContext): ToolResult {
    this.endStroke();
    return this.createResult(true);
  }

  private drawAtPoint(point: Point, color: RGBA, context: ToolContext): void {
    const validPoints = this.getValidPoints(point, context);
    for (const p of validPoints) {
      this.paintAt(p, color, context);
    }
  }
}
