import type { BodyPartName } from '../types';

/** UV coordinates for a face [x1, y1, x2, y2] in pixels */
export type UVCoords = [number, number, number, number];

/** UV mapping for all faces of a body part */
export interface BodyPartUV {
  top: UVCoords;
  bottom: UVCoords;
  front: UVCoords;
  back: UVCoords;
  left: UVCoords;
  right: UVCoords;
}

export type { BodyPartUV as BodyPartUVType };

/** Base and overlay UV mappings */
export interface BodyPartLayerUV {
  base: BodyPartUV;
  overlay: BodyPartUV;
}

/** Complete UV mapping for 64x64 modern skins */
export const SKIN_UV_MAP: Record<BodyPartName, BodyPartLayerUV> = {
  // HEAD (8x8x8)
  head: {
    base: {
      top: [8, 0, 16, 8],
      bottom: [16, 0, 24, 8],
      right: [0, 8, 8, 16],
      front: [8, 8, 16, 16],
      left: [16, 8, 24, 16],
      back: [24, 8, 32, 16],
    },
    overlay: {
      top: [40, 0, 48, 8],
      bottom: [48, 0, 56, 8],
      right: [32, 8, 40, 16],
      front: [40, 8, 48, 16],
      left: [48, 8, 56, 16],
      back: [56, 8, 64, 16],
    },
  },

  // BODY (8x12x4)
  body: {
    base: {
      top: [20, 16, 28, 20],
      bottom: [28, 16, 36, 20],
      right: [16, 20, 20, 32],
      front: [20, 20, 28, 32],
      left: [28, 20, 32, 32],
      back: [32, 20, 40, 32],
    },
    overlay: {
      top: [20, 32, 28, 36],
      bottom: [28, 32, 36, 36],
      right: [16, 36, 20, 48],
      front: [20, 36, 28, 48],
      left: [28, 36, 32, 48],
      back: [32, 36, 40, 48],
    },
  },

  // RIGHT ARM (4x12x4 classic, 3x12x4 slim)
  rightArm: {
    base: {
      top: [44, 16, 48, 20],
      bottom: [48, 16, 52, 20],
      right: [40, 20, 44, 32],
      front: [44, 20, 48, 32],
      left: [48, 20, 52, 32],
      back: [52, 20, 56, 32],
    },
    overlay: {
      top: [44, 32, 48, 36],
      bottom: [48, 32, 52, 36],
      right: [40, 36, 44, 48],
      front: [44, 36, 48, 48],
      left: [48, 36, 52, 48],
      back: [52, 36, 56, 48],
    },
  },

  // LEFT ARM (4x12x4 classic, 3x12x4 slim) - 1.8+ only
  leftArm: {
    base: {
      top: [36, 48, 40, 52],
      bottom: [40, 48, 44, 52],
      right: [32, 52, 36, 64],
      front: [36, 52, 40, 64],
      left: [40, 52, 44, 64],
      back: [44, 52, 48, 64],
    },
    overlay: {
      top: [52, 48, 56, 52],
      bottom: [56, 48, 60, 52],
      right: [48, 52, 52, 64],
      front: [52, 52, 56, 64],
      left: [56, 52, 60, 64],
      back: [60, 52, 64, 64],
    },
  },

  // RIGHT LEG (4x12x4)
  rightLeg: {
    base: {
      top: [4, 16, 8, 20],
      bottom: [8, 16, 12, 20],
      right: [0, 20, 4, 32],
      front: [4, 20, 8, 32],
      left: [8, 20, 12, 32],
      back: [12, 20, 16, 32],
    },
    overlay: {
      top: [4, 32, 8, 36],
      bottom: [8, 32, 12, 36],
      right: [0, 36, 4, 48],
      front: [4, 36, 8, 48],
      left: [8, 36, 12, 48],
      back: [12, 36, 16, 48],
    },
  },

  // LEFT LEG (4x12x4) - 1.8+ only
  leftLeg: {
    base: {
      top: [20, 48, 24, 52],
      bottom: [24, 48, 28, 52],
      right: [16, 52, 20, 64],
      front: [20, 52, 24, 64],
      left: [24, 52, 28, 64],
      back: [28, 52, 32, 64],
    },
    overlay: {
      top: [4, 48, 8, 52],
      bottom: [8, 48, 12, 52],
      right: [0, 52, 4, 64],
      front: [4, 52, 8, 64],
      left: [8, 52, 12, 64],
      back: [12, 52, 16, 64],
    },
  },
} as const;

/** Body part 3D dimensions [width, height, depth] */
export const BODY_PART_DIMENSIONS: Record<
  BodyPartName,
  { classic: [number, number, number]; slim?: [number, number, number] }
> = {
  head: { classic: [8, 8, 8] },
  body: { classic: [8, 12, 4] },
  rightArm: { classic: [4, 12, 4], slim: [3, 12, 4] },
  leftArm: { classic: [4, 12, 4], slim: [3, 12, 4] },
  rightLeg: { classic: [4, 12, 4] },
  leftLeg: { classic: [4, 12, 4] },
} as const;

/** Body part positions relative to model center (Y=0 at feet) */
export const BODY_PART_POSITIONS: Record<BodyPartName, [number, number, number]> = {
  head: [0, 28, 0], // Head sits on top of body (24 + 8/2 = 28)
  body: [0, 18, 0], // Body center (12 + 12/2 = 18)
  rightArm: [-6, 18, 0], // Will be adjusted for slim
  leftArm: [6, 18, 0],
  rightLeg: [-2, 6, 0], // Leg center (0 + 12/2 = 6)
  leftLeg: [2, 6, 0],
} as const;

/** Overlay scale factor (slightly larger than base) */
export const OVERLAY_SCALE = 1.125;

/** Get all UV regions as flat rectangles for 2D editor overlay */
export function getAllUVRegions(): Array<{
  name: string;
  part: BodyPartName;
  layer: 'base' | 'overlay';
  face: keyof BodyPartUV;
  coords: UVCoords;
  color: string;
}> {
  const regions: Array<{
    name: string;
    part: BodyPartName;
    layer: 'base' | 'overlay';
    face: keyof BodyPartUV;
    coords: UVCoords;
    color: string;
  }> = [];

  const colors: Record<BodyPartName, string> = {
    head: 'rgba(255, 100, 100, 0.3)',
    body: 'rgba(100, 255, 100, 0.3)',
    rightArm: 'rgba(100, 100, 255, 0.3)',
    leftArm: 'rgba(255, 255, 100, 0.3)',
    rightLeg: 'rgba(255, 100, 255, 0.3)',
    leftLeg: 'rgba(100, 255, 255, 0.3)',
  };

  for (const [partName, partUV] of Object.entries(SKIN_UV_MAP)) {
    const part = partName as BodyPartName;
    for (const layerType of ['base', 'overlay'] as const) {
      const layerUV = partUV[layerType];
      for (const [faceName, coords] of Object.entries(layerUV)) {
        regions.push({
          name: `${part} ${layerType} ${faceName}`,
          part,
          layer: layerType,
          face: faceName as keyof BodyPartUV,
          coords: coords as UVCoords,
          color: colors[part],
        });
      }
    }
  }

  return regions;
}
