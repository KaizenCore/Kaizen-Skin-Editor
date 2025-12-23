import type { SkinModel } from '../core/types';

interface MojangProfile {
  id: string;
  name: string;
}

interface MojangTextures {
  SKIN?: {
    url: string;
    metadata?: { model: 'slim' };
  };
  CAPE?: {
    url: string;
  };
}

interface MojangProfileResponse {
  id: string;
  name: string;
  properties: Array<{
    name: string;
    value: string; // Base64 encoded
  }>;
}

export class MojangApi {
  private static readonly USERNAME_API = 'https://api.mojang.com/users/profiles/minecraft';
  private static readonly PROFILE_API = 'https://sessionserver.mojang.com/session/minecraft/profile';

  /** Fetch skin by Minecraft username */
  static async fetchSkinByUsername(username: string): Promise<{
    imageData: ImageData;
    model: SkinModel;
    uuid: string;
    skinUrl: string;
  }> {
    // Step 1: Get UUID from username
    const profileResponse = await fetch(`${this.USERNAME_API}/${encodeURIComponent(username)}`);

    if (!profileResponse.ok) {
      if (profileResponse.status === 404) {
        throw new Error(`Player "${username}" not found`);
      }
      throw new Error(`Failed to lookup player: ${profileResponse.status}`);
    }

    const profile: MojangProfile = await profileResponse.json();

    // Step 2: Get skin URL from UUID
    const texturesResponse = await fetch(`${this.PROFILE_API}/${profile.id}`);

    if (!texturesResponse.ok) {
      throw new Error(`Failed to get player profile: ${texturesResponse.status}`);
    }

    const fullProfile: MojangProfileResponse = await texturesResponse.json();

    // Step 3: Decode textures from base64
    const texturesProperty = fullProfile.properties.find((p) => p.name === 'textures');

    if (!texturesProperty) {
      throw new Error('Player has no skin set');
    }

    const texturesJson = atob(texturesProperty.value);
    const textures: { textures: MojangTextures } = JSON.parse(texturesJson);

    if (!textures.textures.SKIN) {
      throw new Error('Player has no skin set');
    }

    // Step 4: Fetch and load skin image
    const skinUrl = textures.textures.SKIN.url;
    const model: SkinModel =
      textures.textures.SKIN.metadata?.model === 'slim' ? 'slim' : 'classic';

    const imageData = await this.fetchSkinImage(skinUrl);

    return {
      imageData,
      model,
      uuid: profile.id,
      skinUrl,
    };
  }

  private static async fetchSkinImage(url: string): Promise<ImageData> {
    // Fetch the skin image
    // Note: This might have CORS issues in browser, but Tauri's HTTP plugin bypasses CORS
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
