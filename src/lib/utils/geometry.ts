import type { Point, Rect } from '../core/types';

/**
 * Bresenham's line algorithm
 * Returns all points on a line between two points
 */
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): Point[] {
  const points: Point[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

/**
 * Get points forming a circle outline
 */
export function circlePoints(cx: number, cy: number, radius: number): Point[] {
  const points: Point[] = [];
  let x = radius;
  let y = 0;
  let err = 0;

  while (x >= y) {
    points.push({ x: cx + x, y: cy + y });
    points.push({ x: cx + y, y: cy + x });
    points.push({ x: cx - y, y: cy + x });
    points.push({ x: cx - x, y: cy + y });
    points.push({ x: cx - x, y: cy - y });
    points.push({ x: cx - y, y: cy - x });
    points.push({ x: cx + y, y: cy - x });
    points.push({ x: cx + x, y: cy - y });

    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }

  return points;
}

/**
 * Get all points inside a filled circle
 */
export function filledCirclePoints(cx: number, cy: number, radius: number): Point[] {
  const points: Point[] = [];
  const r2 = radius * radius;

  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= r2) {
        points.push({ x: cx + x, y: cy + y });
      }
    }
  }

  return points;
}

/**
 * Get brush points based on brush size
 */
export function getBrushPoints(center: Point, size: number): Point[] {
  if (size <= 1) {
    return [center];
  }

  const radius = Math.floor(size / 2);
  return filledCirclePoints(center.x, center.y, radius);
}

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x < rect.x + rect.width &&
    point.y >= rect.y &&
    point.y < rect.y + rect.height
  );
}

/**
 * Get intersection of two rectangles
 */
export function rectIntersection(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const width = Math.min(a.x + a.width, b.x + b.width) - x;
  const height = Math.min(a.y + a.height, b.y + b.height) - y;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
}

/**
 * Normalize rect to have positive width/height
 */
export function normalizeRect(rect: Rect): Rect {
  let { x, y, width, height } = rect;

  if (width < 0) {
    x += width;
    width = -width;
  }

  if (height < 0) {
    y += height;
    height = -height;
  }

  return { x, y, width, height };
}

/**
 * Apply symmetry to a point
 */
export function applySymmetry(
  point: Point,
  mode: 'none' | 'horizontal' | 'vertical' | 'both',
  canvasWidth: number,
  canvasHeight: number
): Point[] {
  const points: Point[] = [point];

  if (mode === 'none') {
    return points;
  }

  if (mode === 'horizontal' || mode === 'both') {
    points.push({ x: canvasWidth - 1 - point.x, y: point.y });
  }

  if (mode === 'vertical' || mode === 'both') {
    points.push({ x: point.x, y: canvasHeight - 1 - point.y });
  }

  if (mode === 'both') {
    points.push({ x: canvasWidth - 1 - point.x, y: canvasHeight - 1 - point.y });
  }

  return points;
}
