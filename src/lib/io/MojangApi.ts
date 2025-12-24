import type { SkinModel } from '../core/types';

export class MojangApi {
  // Using mineatar.io API which provides CORS-friendly access to Minecraft skins
  private static readonly MINEATAR_API = 'https://api.mineatar.io';

  /** Fetch skin by Minecraft username */
  static async fetchSkinByUsername(username: string): Promise<{
    imageData: ImageData;
    model: SkinModel;
    uuid: string;
    skinUrl: string;
  }> {
    // Use mineatar.io API to get player UUID
    const uuidResponse = await fetch(
      `${this.MINEATAR_API}/uuid/${encodeURIComponent(username)}`
    );

    if (!uuidResponse.ok) {
      if (uuidResponse.status === 404 || uuidResponse.status === 204) {
        throw new Error(`Player "${username}" not found`);
      }
      throw new Error(`Failed to lookup player: ${uuidResponse.status}`);
    }

    const uuidData = await uuidResponse.json();
    const uuid = uuidData.uuid;

    if (!uuid) {
      throw new Error(`Player "${username}" not found`);
    }

    // Fetch the raw skin image from mineatar.io
    const skinUrl = `${this.MINEATAR_API}/skin/${uuid}`;
    const imageData = await this.fetchSkinImage(skinUrl);

    // Determine model from skin dimensions or default to classic
    // mineatar returns the raw skin, so we default to classic
    // In the future, we could check the player's profile for slim/classic
    const model: SkinModel = 'classic';

    return {
      imageData,
      model,
      uuid,
      skinUrl,
    };
  }

  private static async fetchSkinImage(url: string): Promise<ImageData> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch skin image: ${response.status}`);
    }

    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);

    return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
  }

  /** Format UUID with dashes */
  static formatUuid(uuid: string): string {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  }
}
