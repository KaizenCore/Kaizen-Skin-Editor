/** Import Steve skin PNG */
import steveSkinUrl from '@/steve.png';

/** Supported skin formats */
export type SkinFormat = 'modern' | 'legacy'; // 64x64 vs 64x32

/** Skin model type */
export type SkinModel = 'classic' | 'slim'; // Steve vs Alex arms

/** RGBA color tuple */
export type RGBA = [r: number, g: number, b: number, a: number];

/** Point in 2D space */
export interface Point {
  x: number;
  y: number;
}

/** Rectangle bounds */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Single pixel data */
export interface Pixel {
  x: number;
  y: number;
  color: RGBA;
}

/** Blend modes for layers */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'soft-light'
  | 'hard-light'
  | 'difference'
  | 'exclusion';

/** Layer in the document */
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0-1
  blendMode: BlendMode;
  imageData: ImageData;
}

/** Complete skin document */
export interface SkinDocument {
  id: string;
  name: string;
  format: SkinFormat;
  model: SkinModel;
  width: 64;
  height: 64 | 32;
  layers: Layer[];
  activeLayerId: string;
  createdAt: Date;
  modifiedAt: Date;
}

/** Selection state */
export interface Selection {
  type: 'rectangle' | 'freeform' | 'magic-wand';
  bounds: Rect;
  mask?: ImageData;
}

/** Symmetry modes for tools */
export type SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'both';

/** Tool identifiers */
export type ToolId =
  | 'pencil'
  | 'eraser'
  | 'eyedropper'
  | 'fill'
  | 'selection'
  | 'gradient'
  | 'noise'
  | 'line'
  | 'color-replacement';


/** Body part names */
export type BodyPartName =
  | 'head'
  | 'body'
  | 'rightArm'
  | 'leftArm'
  | 'rightLeg'
  | 'leftLeg';

/** Create a new empty layer */
export function createLayer(name: string, width = 64, height = 64, fillColor?: RGBA): Layer {
  const imageData = new ImageData(width, height);

  // Fill with color if provided
  if (fillColor) {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = fillColor[0];
      data[i + 1] = fillColor[1];
      data[i + 2] = fillColor[2];
      data[i + 3] = fillColor[3];
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    imageData,
  };
}

/** Default skin color - light gray, easy to see and customize */
const DEFAULT_SKIN_COLOR: RGBA = [180, 180, 180, 255];

/** Steve skin image data - cached */
let steveSkinData: ImageData | null = null;

/** Load Steve's skin from the PNG file */
async function loadSteveSkinAsync(): Promise<ImageData> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = new OffscreenCanvas(64, 64);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, 64, 64);
      steveSkinData = imageData;
      resolve(imageData);
    };
    img.onerror = () => {
      // Fallback to empty skin if loading fails
      resolve(new ImageData(64, 64));
    };
    img.src = steveSkinUrl;
  });
}

/** Get Steve's skin synchronously (returns cached or empty) */
function getSteveSkin(): ImageData {
  if (steveSkinData) return steveSkinData;
  // Return empty ImageData as placeholder, will be replaced when loaded
  return new ImageData(64, 64);
}

/** Initialize Steve skin loading */
const steveSkinPromise = typeof window !== 'undefined' ? loadSteveSkinAsync() : Promise.resolve(new ImageData(64, 64));

/** Export the promise for waiting on Steve skin */
export { steveSkinPromise };

/**
 * BASE UV regions - these get filled with default color
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

// OVERLAY UV regions are defined in constants.ts for use by the renderer

/** Check if a pixel is within a BASE UV region (overlays stay transparent) */
function isBasePixel(x: number, y: number): boolean {
  for (const [x1, y1, x2, y2] of BASE_UV_REGIONS) {
    if (x >= x1 && x < x2 && y >= y1 && y < y2) {
      return true;
    }
  }
  return false;
}

/** Create a layer with only BASE UV regions filled (overlays transparent) */
function createSkinLayer(name: string, width: number, height: number, fillColor: RGBA): Layer {
  const imageData = new ImageData(width, height);
  const data = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Only fill base regions, leave overlays transparent
      if (isBasePixel(x, y)) {
        const i = (y * width + x) * 4;
        data[i] = fillColor[0];
        data[i + 1] = fillColor[1];
        data[i + 2] = fillColor[2];
        data[i + 3] = fillColor[3];
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'normal',
    imageData,
  };
}

/** Create a new skin document */
export function createSkinDocument(options: {
  name?: string;
  format?: SkinFormat;
  model?: SkinModel;
  useSteveSkin?: boolean;
}): SkinDocument {
  const format = options.format ?? 'modern';
  const height = format === 'modern' ? 64 : 32;
  const useSteve = options.useSteveSkin ?? true; // Default to Steve skin

  let layer: Layer;
  if (useSteve && format === 'modern') {
    // Use Steve's skin as the default
    const steveSkin = getSteveSkin();
    layer = {
      id: crypto.randomUUID(),
      name: 'Background',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      imageData: cloneImageData(steveSkin),
    };
  } else {
    // Use the default gray skin
    layer = createSkinLayer('Background', 64, height, DEFAULT_SKIN_COLOR);
  }

  return {
    id: crypto.randomUUID(),
    name: options.name ?? 'Untitled',
    format,
    model: options.model ?? 'classic',
    width: 64,
    height,
    layers: [layer],
    activeLayerId: layer.id,
    createdAt: new Date(),
    modifiedAt: new Date(),
  };
}

/** Clone ImageData */
export function cloneImageData(imageData: ImageData): ImageData {
  return new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
}
