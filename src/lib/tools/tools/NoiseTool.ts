import type { Point, RGBA } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';

/**
 * Noise tool - paints with random color variation
 */
export class NoiseTool extends BaseTool {
  readonly id = 'noise' as const;
  readonly name = 'Noise';
  readonly icon = 'Sparkles';
  readonly shortcut = 'N';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = true;
  readonly usesBrushOpacity = true;
  readonly usesSymmetry = true;

  // Noise strength (0-1) - how much random variation to apply
  private noiseStrength = 0.3;

  setNoiseStrength(strength: number): void {
    this.noiseStrength = Math.max(0, Math.min(1, strength));
  }

  getNoiseStrength(): number {
    return this.noiseStrength;
  }

  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    this.startStroke(point);

    const baseColor = useSecondary ? context.secondaryColor : context.primaryColor;
    this.drawNoiseAtPoint(point, baseColor, context);

    return this.createResult(false);
  }

  onMove(point: Point, context: ToolContext, useSecondary: boolean): ToolResult {
    if (!this.state.isActive) {
      return this.createResult(false);
    }

    const baseColor = useSecondary ? context.secondaryColor : context.primaryColor;

    // Interpolate from last point for smooth strokes
    if (this.lastPoint) {
      const interpolated = this.interpolatePoints(this.lastPoint, point);
      for (const p of interpolated) {
        this.drawNoiseAtPoint(p, baseColor, context);
      }
    } else {
      this.drawNoiseAtPoint(point, baseColor, context);
    }

    this.lastPoint = point;
    this.state.currentPoint = point;

    return this.createResult(false);
  }

  onEnd(_point: Point, _context: ToolContext): ToolResult {
    this.endStroke();
    return this.createResult(true);
  }

  private drawNoiseAtPoint(point: Point, baseColor: RGBA, context: ToolContext): void {
    const validPoints = this.getValidPoints(point, context);

    for (const p of validPoints) {
      // Apply random variation to each pixel
      const noisyColor = this.addNoise(baseColor);
      this.paintAt(p, noisyColor, context);
    }
  }

  private addNoise(color: RGBA): RGBA {
    const variation = 255 * this.noiseStrength;

    return [
      this.clampColor(color[0] + this.randomOffset(variation)),
      this.clampColor(color[1] + this.randomOffset(variation)),
      this.clampColor(color[2] + this.randomOffset(variation)),
      color[3], // Keep alpha unchanged
    ];
  }

  private randomOffset(maxVariation: number): number {
    return Math.round((Math.random() - 0.5) * 2 * maxVariation);
  }

  private clampColor(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }
}
