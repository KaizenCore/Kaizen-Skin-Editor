import type { Point, RGBA } from '../../core/types/skin';
import type { ToolContext, ToolResult } from '../types';
import { BaseTool } from '../BaseTool';

/**
 * Eyedropper tool - samples color from canvas
 */
export class EyedropperTool extends BaseTool {
  readonly id = 'eyedropper' as const;
  readonly name = 'Eyedropper';
  readonly icon = 'Pipette';
  readonly shortcut = 'I';
  readonly cursor = 'crosshair';
  readonly usesBrushSize = false;
  readonly usesBrushOpacity = false;
  readonly usesSymmetry = false;

  onStart(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    const color = this.sampleColor(point, context);
    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: true,
      pickedColor: color,
    };
  }

  onMove(point: Point, context: ToolContext, _useSecondary: boolean): ToolResult {
    // Sample color as user drags (for preview)
    const color = this.sampleColor(point, context);
    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: false,
      pickedColor: color,
    };
  }

  onEnd(point: Point, context: ToolContext): ToolResult {
    const color = this.sampleColor(point, context);
    return {
      changedPixels: [],
      originalPixels: [],
      isComplete: true,
      pickedColor: color,
    };
  }

  private sampleColor(point: Point, context: ToolContext): RGBA {
    const { x, y } = point;

    // Bounds check
    if (x < 0 || x >= context.width || y < 0 || y >= context.height) {
      return [0, 0, 0, 0];
    }

    // Sample from composite image if available, otherwise from layer
    const imageData = context.compositeImageData || context.imageData;
    return this.getPixel(x, y, imageData);
  }
}
