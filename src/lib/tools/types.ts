import type { Point, RGBA, Pixel, SymmetryMode, ToolId } from '../core/types/skin';

/** Paint target for restricting painting to base or overlay UV regions */
export type PaintTarget = 'base' | 'overlay';

/** View type context */
export type ViewType = '2d' | '3d';

/** Context passed to tools for painting operations */
export interface ToolContext {
  /** Current layer ID */
  layerId: string;
  /** Layer's image data to paint on */
  imageData: ImageData;
  /** Primary drawing color */
  primaryColor: RGBA;
  /** Secondary drawing color (right-click) */
  secondaryColor: RGBA;
  /** Brush size in pixels */
  brushSize: number;
  /** Brush opacity (0-1) */
  brushOpacity: number;
  /** Symmetry mode for mirroring strokes */
  symmetryMode: SymmetryMode;
  /** Restricts painting to base or overlay UV regions */
  paintTarget: PaintTarget;
  /** Canvas dimensions */
  width: number;
  height: number;
  /** View context (2D canvas or 3D model) */
  viewType: ViewType;
  /** Composite image data (for eyedropper sampling) */
  compositeImageData?: ImageData;
}

/** Result of a tool operation */
export interface ToolResult {
  /** Pixels that were changed */
  changedPixels: Pixel[];
  /** Original pixels before change (for undo) */
  originalPixels: Pixel[];
  /** Whether the operation is complete (false for drag operations) */
  isComplete: boolean;
  /** Optional: new color picked (for eyedropper) */
  pickedColor?: RGBA;
  /** Optional: preview pixels to render (for line, gradient preview) */
  previewPixels?: Pixel[];
}

/** Tool state during multi-step operations (e.g., line drawing) */
export interface ToolState {
  /** Whether tool is currently active (mouse down) */
  isActive: boolean;
  /** Starting point of operation */
  startPoint?: Point;
  /** Current point during drag */
  currentPoint?: Point;
  /** Preview pixels to show during operation */
  previewPixels?: Pixel[];
  /** Accumulated changed pixels during stroke */
  changedPixels: Map<string, Pixel>;
  /** Original pixels before stroke started */
  originalPixels: Map<string, Pixel>;
}

/** Tool metadata for UI */
export interface ToolMetadata {
  /** Unique tool identifier */
  id: ToolId;
  /** Display name */
  name: string;
  /** Lucide icon name */
  icon: string;
  /** Keyboard shortcut */
  shortcut: string;
  /** Cursor style when tool is active */
  cursor: string;
  /** Whether this tool uses brush size setting */
  usesBrushSize: boolean;
  /** Whether this tool uses brush opacity setting */
  usesBrushOpacity: boolean;
  /** Whether this tool supports symmetry */
  usesSymmetry: boolean;
}

/** Main tool interface - all tools must implement this */
export interface Tool extends ToolMetadata {
  /**
   * Called when tool starts (mouse down)
   * @param point - Starting point in texture coordinates
   * @param context - Tool context with settings and image data
   * @param useSecondary - Whether to use secondary color (right-click)
   */
  onStart(point: Point, context: ToolContext, useSecondary: boolean): ToolResult;

  /**
   * Called during drag (mouse move while pressed)
   * @param point - Current point in texture coordinates
   * @param context - Tool context with settings and image data
   * @param useSecondary - Whether to use secondary color
   */
  onMove(point: Point, context: ToolContext, useSecondary: boolean): ToolResult;

  /**
   * Called when tool ends (mouse up)
   * @param point - End point in texture coordinates
   * @param context - Tool context with settings and image data
   */
  onEnd(point: Point, context: ToolContext): ToolResult;

  /**
   * Get current preview pixels (for tools like line, gradient)
   * Called every frame during drag to show preview
   */
  getPreview?(): Pixel[];

  /**
   * Get current tool state
   */
  getState(): ToolState;

  /**
   * Reset tool state (called when switching tools or canceling)
   */
  reset(): void;
}

/** Create a unique key for a pixel position */
export function pixelKey(x: number, y: number): string {
  return `${x},${y}`;
}

/** Create an empty tool state */
export function createToolState(): ToolState {
  return {
    isActive: false,
    changedPixels: new Map(),
    originalPixels: new Map(),
  };
}
