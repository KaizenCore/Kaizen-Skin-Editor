import type { SkinFormat, SkinModel, Layer } from '../core/types';
import { FastImageData } from '../utils/canvas';

export class PngCodec {
  /** Load skin from PNG file/blob */
  static async loadFromFile(file: File): Promise<{
    imageData: ImageData;
    format: SkinFormat;
    model: SkinModel;
  }> {
    const bitmap = await createImageBitmap(file);

    // Validate dimensions
    if (bitmap.width !== 64 || (bitmap.height !== 64 && bitmap.height !== 32)) {
      throw new Error(
        `Invalid skin dimensions: ${bitmap.width}x${bitmap.height}. ` +
          `Expected 64x64 (modern) or 64x32 (legacy).`
      );
    }

    const format: SkinFormat = bitmap.height === 64 ? 'modern' : 'legacy';

    // Convert to ImageData
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
    let imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

    // Convert legacy to modern if needed
    if (format === 'legacy') {
      imageData = this.convertLegacyToModern(imageData);
    }

    // Detect model type (slim vs classic) by checking arm pixel width
    const model = this.detectModel(imageData);

    return { imageData, format, model };
  }

  /** Export skin to PNG blob */
  static async exportToBlob(layers: Layer[], format: SkinFormat): Promise<Blob> {
    const height = format === 'modern' ? 64 : 32;
    const canvas = new OffscreenCanvas(64, height);
    const ctx = canvas.getContext('2d')!;

    // Composite all visible layers
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;

      const layerCanvas = new OffscreenCanvas(64, layer.imageData.height);
      const layerCtx = layerCanvas.getContext('2d')!;
      layerCtx.putImageData(layer.imageData, 0, 0);
      ctx.drawImage(layerCanvas, 0, 0);
    }

    return canvas.convertToBlob({ type: 'image/png' });
  }

  /** Download skin as PNG file */
  static async downloadSkin(layers: Layer[], format: SkinFormat, filename = 'skin.png'): Promise<void> {
    const blob = await this.exportToBlob(layers, format);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  /** Convert legacy (64x32) to modern (64x64) format */
  static convertLegacyToModern(legacyData: ImageData): ImageData {
    if (legacyData.height === 64) return legacyData;

    const modernData = new ImageData(64, 64);
    const legacyFast = new FastImageData(legacyData);
    const modernFast = new FastImageData(modernData);

    // Copy top half as-is
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 64; x++) {
        modernFast.setPixel(x, y, legacyFast.getPixel(x, y));
      }
    }

    // Mirror right limbs to left limbs for the new 64x64 areas
    // Left leg = mirror of right leg (at y=48-64)
    this.mirrorRegion(
      legacyFast,
      modernFast,
      { x: 0, y: 16, width: 16, height: 16 }, // right leg source
      { x: 16, y: 48 } // left leg dest
    );

    // Left arm = mirror of right arm (at y=48-64)
    this.mirrorRegion(
      legacyFast,
      modernFast,
      { x: 40, y: 16, width: 16, height: 16 }, // right arm source
      { x: 32, y: 48 } // left arm dest
    );

    return modernFast.toImageData();
  }

  private static detectModel(imageData: ImageData): SkinModel {
    // Check if right arm area has slim (3px) or classic (4px) width
    // by examining transparency in the rightmost arm column
    const fastData = new FastImageData(imageData);

    // Check arm area at x=47 (would be empty in slim model)
    let transparentCount = 0;
    for (let y = 20; y < 32; y++) {
      const pixel = fastData.getPixel(47, y);
      if (pixel[3] === 0) transparentCount++;
    }

    return transparentCount >= 10 ? 'slim' : 'classic';
  }

  private static mirrorRegion(
    source: FastImageData,
    dest: FastImageData,
    sourceRect: { x: number; y: number; width: number; height: number },
    destPos: { x: number; y: number }
  ): void {
    for (let y = 0; y < sourceRect.height; y++) {
      for (let x = 0; x < sourceRect.width; x++) {
        const srcPixel = source.getPixel(sourceRect.x + x, sourceRect.y + y);
        // Mirror horizontally
        dest.setPixel(destPos.x + (sourceRect.width - 1 - x), destPos.y + y, srcPixel);
      }
    }
  }
}
