import type { Pixel, Selection } from './types';

export type SyncEvent =
  | { type: 'pixel-change'; pixels: Pixel[] }
  | { type: 'layer-change'; layerId: string }
  | { type: 'full-update' }
  | { type: 'selection-change'; selection: Selection | null }
  | { type: 'viewport-change'; source: '2d' | '3d' };

export interface SyncSubscriber {
  id: string;
  onSync: (event: SyncEvent) => void;
}

/**
 * Manages synchronization between 2D and 3D views
 * Uses RAF batching to coalesce rapid updates
 */
export class SynchronizationManager {
  private subscribers: Map<string, SyncSubscriber> = new Map();
  private pendingEvents: SyncEvent[] = [];
  private rafId: number | null = null;
  private isProcessing = false;

  subscribe(subscriber: SyncSubscriber): () => void {
    this.subscribers.set(subscriber.id, subscriber);
    return () => this.subscribers.delete(subscriber.id);
  }

  /** Queue sync event (batched via requestAnimationFrame) */
  emit(event: SyncEvent): void {
    this.pendingEvents.push(event);
    this.scheduleFlush();
  }

  /** Immediate sync for critical updates */
  emitImmediate(event: SyncEvent): void {
    this.notifySubscribers(event);
  }

  private scheduleFlush(): void {
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.flush();
    });
  }

  private flush(): void {
    if (this.isProcessing || this.pendingEvents.length === 0) return;

    this.isProcessing = true;

    // Coalesce events: if full-update exists, ignore pixel changes
    const events = this.coalesceEvents(this.pendingEvents);
    this.pendingEvents = [];

    for (const event of events) {
      this.notifySubscribers(event);
    }

    this.isProcessing = false;
  }

  private coalesceEvents(events: SyncEvent[]): SyncEvent[] {
    const hasFullUpdate = events.some((e) => e.type === 'full-update');
    if (hasFullUpdate) {
      // Keep only the full update and non-pixel events
      return events.filter(
        (e) =>
          e.type === 'full-update' ||
          e.type === 'selection-change' ||
          e.type === 'viewport-change'
      );
    }

    // Merge pixel changes
    const pixelEvents = events.filter(
      (e) => e.type === 'pixel-change'
    ) as Extract<SyncEvent, { type: 'pixel-change' }>[];

    if (pixelEvents.length > 1) {
      const mergedPixels = pixelEvents.flatMap((e) => e.pixels);
      const otherEvents = events.filter((e) => e.type !== 'pixel-change');
      return [{ type: 'pixel-change', pixels: mergedPixels }, ...otherEvents];
    }

    return events;
  }

  private notifySubscribers(event: SyncEvent): void {
    for (const subscriber of this.subscribers.values()) {
      try {
        subscriber.onSync(event);
      } catch (error) {
        console.error(`Sync subscriber ${subscriber.id} error:`, error);
      }
    }
  }

  dispose(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.subscribers.clear();
    this.pendingEvents = [];
  }
}
