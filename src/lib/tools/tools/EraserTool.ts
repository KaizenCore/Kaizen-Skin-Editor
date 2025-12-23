import type { Point } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';

/**
 * Eraser tool - reduces alpha channel
 */
export class EraserTool extends BaseTool {
  readonly id = 'eraser' as const;
  readonly name = 'Eraser';
  readonly icon = 'Eraser';
  readonly shortcut = 'E';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = true;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = true;

  onStart(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    this.startStroke(point);
    this.eraseAtPoint(point, context);
    return this.createResult(false);
  }

  onMove(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    if (!this.state.isActive) {
      return this.createResult(false);
    }

    // Interpolate from last point for smooth strokes
    if (this.lastPoint) {
      const interpolated = this.interpolatePoints(this.lastPoint, point);
      for (const p of interpolated) {
        this.eraseAtPoint(p, context);
      }
    } else {
      this.eraseAtPoint(point, context);
    }

    this.lastPoint = point;
    this.state.currentPoint = point;

    return this.createResult(false);
  }

  onEnd(_point: Point, _context: ToolContext): ToolResult {
    this.endStroke();
    return this.createResult(true);
  }

  private eraseAtPoint(point: Point, context: ToolContext): void {
    const validPoints = this.getValidPoints(point, context);
    for (const p of validPoints) {
      this.eraseAt(p, context);
    }
  }
}
