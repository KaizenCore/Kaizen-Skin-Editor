import type { Point } from '../core/types/skin';
import type { PaintTarget } from './types';

/**
 * BASE UV regions - areas where base layer textures are mapped
 * Each region is [x1, y1, x2, y2] in pixels
 */
const BASE_UV_REGIONS: Array<[number, number, number, number]> = [
  // === HEAD BASE (row 0-16) ===
  [8, 0, 24, 8],    // Head top + bottom
  [0, 8, 32, 16],   // Head sides (front, back, left, right)

  // === RIGHT LEG BASE (row 16-32) ===
  [4, 16, 12, 20],  // Right leg top + bottom
  [0, 20, 16, 32],  // Right leg sides

  // === BODY BASE (row 16-32) ===
  [20, 16, 36, 20], // Body top + bottom
  [16, 20, 40, 32], // Body sides

  // === RIGHT ARM BASE (row 16-32) ===
  [44, 16, 52, 20], // Right arm top + bottom
  [40, 20, 56, 32], // Right arm sides

  // === LEFT LEG BASE (row 48-64) ===
  [20, 48, 28, 52], // Left leg top + bottom
  [16, 52, 32, 64], // Left leg sides

  // === LEFT ARM BASE (row 48-64) ===
  [36, 48, 44, 52], // Left arm top + bottom
  [32, 52, 48, 64], // Left arm sides
];

/**
 * OVERLAY UV regions - areas where overlay layer textures are mapped
 * Each region is [x1, y1, x2, y2] in pixels
 */
const OVERLAY_UV_REGIONS: Array<[number, number, number, number]> = [
  // === HEAD OVERLAY (row 0-16) ===
  [40, 0, 56, 8],   // Head overlay top + bottom
  [32, 8, 64, 16],  // Head overlay sides

  // === RIGHT LEG OVERLAY (row 32-48) ===
  [4, 32, 12, 36],  // Right leg overlay top + bottom
  [0, 36, 16, 48],  // Right leg overlay sides

  // === BODY OVERLAY (row 32-48) ===
  [20, 32, 36, 36], // Body overlay top + bottom
  [16, 36, 40, 48], // Body overlay sides

  // === RIGHT ARM OVERLAY (row 32-48) ===
  [44, 32, 52, 36], // Right arm overlay top + bottom
  [40, 36, 56, 48], // Right arm overlay sides

  // === LEFT LEG OVERLAY (row 48-64) ===
  [4, 48, 12, 52],  // Left leg overlay top + bottom
  [0, 52, 16, 64],  // Left leg overlay sides

  // === LEFT ARM OVERLAY (row 48-64) ===
  [52, 48, 60, 52], // Left arm overlay top + bottom
  [48, 52, 64, 64], // Left arm overlay sides
];

/**
 * Check if a pixel coordinate falls within any base UV region
 */
export function isBasePixel(x: number, y: number): boolean {
  for (const [x1, y1, x2, y2] of BASE_UV_REGIONS) {
    if (x >= x1 && x < x2 && y >= y1 && y < y2) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a pixel coordinate falls within any overlay UV region
 */
export function isOverlayPixel(x: number, y: number): boolean {
  for (const [x1, y1, x2, y2] of OVERLAY_UV_REGIONS) {
    if (x >= x1 && x < x2 && y >= y1 && y < y2) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a pixel coordinate is valid for the given paint target
 * @param x - X coordinate in texture space
 * @param y - Y coordinate in texture space
 * @param paintTarget - 'base' or 'overlay'
 * @returns true if the pixel can be painted for this target
 */
export function isValidForPaintTarget(
  x: number,
  y: number,
  paintTarget: PaintTarget
): boolean {
  if (paintTarget === 'base') {
    return isBasePixel(x, y);
  } else {
    return isOverlayPixel(x, y);
  }
}

/**
 * Filter an array of points to only include those valid for the paint target
 * @param points - Array of points to filter
 * @param paintTarget - 'base' or 'overlay'
 * @returns Filtered array containing only valid points
 */
export function filterPointsByPaintTarget(
  points: Point[],
  paintTarget: PaintTarget
): Point[] {
  return points.filter(p => isValidForPaintTarget(p.x, p.y, paintTarget));
}

/**
 * Check if a point is within texture bounds
 */
export function isInBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Get all UV regions for a specific paint target
 * Useful for debugging or visualization
 */
export function getUVRegions(paintTarget: PaintTarget): Array<[number, number, number, number]> {
  return paintTarget === 'base' ? [...BASE_UV_REGIONS] : [...OVERLAY_UV_REGIONS];
}
