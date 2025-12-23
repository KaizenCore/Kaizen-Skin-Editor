import type { Command } from './Command';
import type { SkinDocument } from '../core/types';

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
  undoDescription: string | null;
  redoDescription: string | null;
  historyLength: number;
  currentIndex: number;
}

export interface HistoryManagerOptions {
  /** Maximum memory in bytes (default: 50MB) */
  maxMemory?: number;
}

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxMemory: number;
  private currentMemory = 0;

  constructor(options: HistoryManagerOptions = {}) {
    this.maxMemory = options.maxMemory ?? 50 * 1024 * 1024; // 50MB
  }

  /** Execute and record a command */
  execute(command: Command, document: SkinDocument): void {
    command.execute(document);

    // Clear redo stack (new action invalidates redo history)
    for (const cmd of this.redoStack) {
      this.currentMemory -= cmd.getMemorySize();
    }
    this.redoStack = [];

    // Add to undo stack
    this.undoStack.push(command);
    this.currentMemory += command.getMemorySize();

    // Prune old commands if memory exceeded
    this.pruneHistory();
  }

  /** Undo the last command */
  undo(document: SkinDocument): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;

    command.undo(document);
    this.redoStack.push(command);
    // Memory stays the same, just moved between stacks

    return true;
  }

  /** Redo the last undone command */
  redo(document: SkinDocument): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;

    command.execute(document);
    this.undoStack.push(command);
    // Memory stays the same, just moved between stacks

    return true;
  }

  /** Get current state for UI */
  getState(): HistoryState {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoDescription: this.undoStack[this.undoStack.length - 1]?.description ?? null,
      redoDescription: this.redoStack[this.redoStack.length - 1]?.description ?? null,
      historyLength: this.undoStack.length,
      currentIndex: this.undoStack.length,
    };
  }

  /** Clear all history */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentMemory = 0;
  }

  /** Get current memory usage in bytes */
  getMemoryUsage(): number {
    return this.currentMemory;
  }

  private pruneHistory(): void {
    while (this.currentMemory > this.maxMemory && this.undoStack.length > 1) {
      const oldest = this.undoStack.shift();
      if (oldest) {
        this.currentMemory -= oldest.getMemorySize();
      }
    }
  }
}
