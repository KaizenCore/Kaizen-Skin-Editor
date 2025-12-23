import type { Point, RGBA, Pixel } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';
import { bresenhamLine } from '../../utils/geometry';
import { filterPointsByPaintTarget, isInBounds } from '../PaintTargetValidator';

/**
 * Line tool - draws a straight line between two points
 * Shows preview while dragging
 */
export class LineTool extends BaseTool {
  readonly id = 'line' as const;
  readonly name = 'Line';
  readonly icon = 'Minus';
  readonly shortcut = 'L';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = true;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = true;

  private previewColor: RGBA = [0, 0, 0, 255];

  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    this.startStroke(point);
    this.previewColor = useSecondary ? context.secondaryColor : context.primaryColor;

    // Generate initial preview (single point)
    this.updatePreview(point, point, context);

    return this.createResult(false);
  }

  onMove(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      return this.createResult(false);
    }

    this.state.currentPoint = point;

    // Update preview line
    this.updatePreview(this.state.startPoint, point, context);

    return this.createResult(false);
  }

  onEnd(point: Point, context: ToolContext): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      this.endStroke();
      return this.createResult(true);
    }

    // Draw the final line
    this.drawLine(this.state.startPoint, point, context);

    // Clear preview
    this.state.previewPixels = [];
    this.endStroke();

    return this.createResult(true);
  }

  private updatePreview(from: Point, to: Point, context: ToolContext): void {
    const linePoints = bresenhamLine(from.x, from.y, to.x, to.y);
    const previewPixels: Pixel[] = [];

    for (const linePoint of linePoints) {
      // Get brush points with symmetry
      let brushPoints = this.getBrushPointsWithSymmetry(linePoint, context);

      // Filter by bounds and paint target
      brushPoints = brushPoints.filter(p =>
        isInBounds(p.x, p.y, context.width, context.height)
      );
      brushPoints = filterPointsByPaintTarget(brushPoints, context.paintTarget);

      for (const p of brushPoints) {
        previewPixels.push({ x: p.x, y: p.y, color: this.previewColor });
      }
    }

    this.state.previewPixels = previewPixels;
  }

  private drawLine(from: Point, to: Point, context: ToolContext): void {
    const linePoints = bresenhamLine(from.x, from.y, to.x, to.y);

    for (const linePoint of linePoints) {
      const validPoints = this.getValidPoints(linePoint, context);
      for (const p of validPoints) {
        this.paintAt(p, this.previewColor, context);
      }
    }
  }
}
