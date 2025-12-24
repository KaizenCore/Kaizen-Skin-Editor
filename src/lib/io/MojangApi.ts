import type { SkinModel } from '../core/types';

export class MojangApi {
  // Using mineatar.io API which provides CORS-friendly access to Minecraft skins
  private static readonly MINEATAR_API = 'https://api.mineatar.io';
  // Using ashcon.app for username to UUID lookup (CORS-friendly)
  private static readonly ASHCON_API = 'https://api.ashcon.app/mojang/v2/user';

  /** Fetch skin by Minecraft username */
  static async fetchSkinByUsername(username: string): Promise<{
    imageData: ImageData;
    model: SkinModel;
    uuid: string;
    skinUrl: string;
  }> {
    // Use ashcon.app API to get player UUID (CORS-friendly)
    const profileResponse = await fetch(
      `${this.ASHCON_API}/${encodeURIComponent(username)}`
    );

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        throw new Error(`Player "${username}" not found`);
      }
      throw new Error(`Failed to lookup player: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    const uuid = profileData.uuid?.replace(/-/g, '');

    if (!uuid) {
      throw new Error(`Player "${username}" not found`);
    }

    // Determine model from profile data
    const model: SkinModel = profileData.textures?.slim ? 'slim' : 'classic';

    // Fetch the raw skin image from mineatar.io
    const skinUrl = `${this.MINEATAR_API}/skin/${uuid}`;
    const imageData = await this.fetchSkinImage(skinUrl);

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
