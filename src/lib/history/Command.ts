import type { SkinDocument, Pixel, Layer } from '../core/types';

/** Base interface for all commands (Command pattern) */
export interface Command {
  /** Unique identifier for this command */
  readonly id: string;

  /** Human-readable description */
  readonly description: string;

  /** Execute the command */
  execute(document: SkinDocument): void;

  /** Reverse the command */
  undo(document: SkinDocument): void;

  /** Get memory size estimate in bytes (for history pruning) */
  getMemorySize(): number;
}

/** Draw command - records pixel changes */
export class DrawCommand implements Command {
  readonly id = crypto.randomUUID();
  readonly description: string;

  constructor(
    private layerId: string,
    private originalPixels: Pixel[],
    private newPixels: Pixel[]
  ) {
    this.description = `Draw ${newPixels.length} pixel${newPixels.length > 1 ? 's' : ''}`;
  }

  execute(document: SkinDocument): void {
    const layer = document.layers.find((l) => l.id === this.layerId);
    if (!layer) return;

    for (const pixel of this.newPixels) {
      const idx = (pixel.y * layer.imageData.width + pixel.x) * 4;
      layer.imageData.data[idx] = pixel.color[0];
      layer.imageData.data[idx + 1] = pixel.color[1];
      layer.imageData.data[idx + 2] = pixel.color[2];
      layer.imageData.data[idx + 3] = pixel.color[3];
    }
  }

  undo(document: SkinDocument): void {
    const layer = document.layers.find((l) => l.id === this.layerId);
    if (!layer) return;

    for (const pixel of this.originalPixels) {
      const idx = (pixel.y * layer.imageData.width + pixel.x) * 4;
      layer.imageData.data[idx] = pixel.color[0];
      layer.imageData.data[idx + 1] = pixel.color[1];
      layer.imageData.data[idx + 2] = pixel.color[2];
      layer.imageData.data[idx + 3] = pixel.color[3];
    }
  }

  getMemorySize(): number {
    // 4 bytes per pixel color + 8 bytes for coordinates
    return (this.originalPixels.length + this.newPixels.length) * 12;
  }
}

/** Layer creation command */
export class CreateLayerCommand implements Command {
  readonly id = crypto.randomUUID();
  readonly description: string;

  constructor(private layer: Layer, private insertIndex: number) {
    this.description = `Create layer "${layer.name}"`;
  }

  execute(document: SkinDocument): void {
    document.layers.splice(this.insertIndex, 0, this.layer);
  }

  undo(document: SkinDocument): void {
    const index = document.layers.findIndex((l) => l.id === this.layer.id);
    if (index !== -1) {
      document.layers.splice(index, 1);
    }
  }

  getMemorySize(): number {
    return this.layer.imageData.data.length + 200; // ImageData + metadata
  }
}

/** Layer deletion command */
export class DeleteLayerCommand implements Command {
  readonly id = crypto.randomUUID();
  readonly description: string;
  private deletedLayer: Layer | null = null;
  private deletedIndex = -1;

  constructor(private layerId: string) {
    this.description = 'Delete layer';
  }

  execute(document: SkinDocument): void {
    this.deletedIndex = document.layers.findIndex((l) => l.id === this.layerId);
    if (this.deletedIndex !== -1) {
      this.deletedLayer = document.layers[this.deletedIndex]!;
      document.layers.splice(this.deletedIndex, 1);
    }
  }

  undo(document: SkinDocument): void {
    if (this.deletedLayer && this.deletedIndex !== -1) {
      document.layers.splice(this.deletedIndex, 0, this.deletedLayer);
    }
  }

  getMemorySize(): number {
    return this.deletedLayer ? this.deletedLayer.imageData.data.length + 200 : 100;
  }
}

/** Layer property change command */
export class LayerPropertyCommand implements Command {
  readonly id = crypto.randomUUID();
  readonly description: string;
  private oldValue: unknown;

  constructor(
    private layerId: string,
    private property: keyof Layer,
    private newValue: unknown
  ) {
    this.description = `Change layer ${property}`;
  }

  execute(document: SkinDocument): void {
    const layer = document.layers.find((l) => l.id === this.layerId);
    if (!layer) return;

    this.oldValue = layer[this.property];
    (layer as Record<string, unknown>)[this.property] = this.newValue;
  }

  undo(document: SkinDocument): void {
    const layer = document.layers.find((l) => l.id === this.layerId);
    if (!layer) return;

    (layer as Record<string, unknown>)[this.property] = this.oldValue;
  }

  getMemorySize(): number {
    return 100;
  }
}

/** Composite command for grouping multiple commands */
export class CompositeCommand implements Command {
  readonly id = crypto.randomUUID();

  constructor(
    readonly description: string,
    private commands: Command[]
  ) {}

  execute(document: SkinDocument): void {
    for (const cmd of this.commands) {
      cmd.execute(document);
    }
  }

  undo(document: SkinDocument): void {
    // Undo in reverse order
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i]!.undo(document);
    }
  }

  getMemorySize(): number {
    return this.commands.reduce((sum, cmd) => sum + cmd.getMemorySize(), 0);
  }
}
