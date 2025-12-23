import type { Point, RGBA, Pixel } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';
import { bresenhamLine, distance } from '../../utils/geometry';
import { gradientColors } from '../../utils/color';
import { isValidForPaintTarget, isInBounds } from '../PaintTargetValidator';

/**
 * Gradient tool - draws a gradient between two points
 * Uses primary and secondary color
 */
export class GradientTool extends BaseTool {
  readonly id = 'gradient' as const;
  readonly name = 'Gradient';
  readonly icon = 'Blend';
  readonly shortcut = 'D';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = false;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = false;

  onStart(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    this.startStroke(point);

    // Generate initial preview (single point)
    this.updatePreview(point, point, context);

    return this.createResult(false);
  }

  onMove(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      return this.createResult(false);
    }

    this.state.currentPoint = point;

    // Update preview gradient
    this.updatePreview(this.state.startPoint, point, context);

    return this.createResult(false);
  }

  onEnd(point: Point, context: ToolContext): ToolResult {
    if (!this.state.isActive || !this.state.startPoint) {
      this.endStroke();
      return this.createResult(true);
    }

    // Draw the final gradient
    this.drawGradient(this.state.startPoint, point, context);

    // Clear preview
    this.state.previewPixels = [];
    this.endStroke();

    return this.createResult(true);
  }

  private updatePreview(from: Point, to: Point, context: ToolContext): void {
    const previewPixels = this.calculateGradientPixels(from, to, context);
    this.state.previewPixels = previewPixels;
  }

  private calculateGradientPixels(from: Point, to: Point, context: ToolContext): Pixel[] {
    const linePoints = bresenhamLine(from.x, from.y, to.x, to.y);
    if (linePoints.length < 2) {
      return [{ x: from.x, y: from.y, color: context.primaryColor }];
    }

    // Generate gradient colors
    const colors = gradientColors(context.primaryColor, context.secondaryColor, linePoints.length);
    const pixels: Pixel[] = [];

    for (let i = 0; i < linePoints.length; i++) {
      const p = linePoints[i]!;
      const color = colors[i] || context.primaryColor;

      // Check bounds and paint target
      if (isInBounds(p.x, p.y, context.width, context.height) &&
          isValidForPaintTarget(p.x, p.y, context.paintTarget)) {
        pixels.push({ x: p.x, y: p.y, color });
      }
    }

    return pixels;
  }

  private drawGradient(from: Point, to: Point, context: ToolContext): void {
    const totalDistance = distance(from, to);
    if (totalDistance < 1) {
      // Single point - use primary color
      if (isInBounds(from.x, from.y, context.width, context.height) &&
          isValidForPaintTarget(from.x, from.y, context.paintTarget)) {
        this.paintAt(from, context.primaryColor, context);
      }
      return;
    }

    // Calculate gradient for entire affected area
    // For each pixel in bounding box, determine its position on gradient line
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);

    const dx = to.x - from.x;
    const dy = to.y - from.y;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!isInBounds(x, y, context.width, context.height)) continue;
        if (!isValidForPaintTarget(x, y, context.paintTarget)) continue;

        // Project point onto gradient line to get t value (0-1)
        const px = x - from.x;
        const py = y - from.y;
        const t = Math.max(0, Math.min(1, (px * dx + py * dy) / (totalDistance * totalDistance)));

        // Interpolate color
        const color: RGBA = [
          Math.round(context.primaryColor[0] + (context.secondaryColor[0] - context.primaryColor[0]) * t),
          Math.round(context.primaryColor[1] + (context.secondaryColor[1] - context.primaryColor[1]) * t),
          Math.round(context.primaryColor[2] + (context.secondaryColor[2] - context.primaryColor[2]) * t),
          Math.round(context.primaryColor[3] + (context.secondaryColor[3] - context.primaryColor[3]) * t),
        ];

        this.paintAt({ x, y }, color, context);
      }
    }
  }
}
