import type { ToolId } from '../core/types/skin';
import type { Tool, ToolMetadata } from './types';

/**
 * Registry for all available tools
 * Provides centralized access and lookup
 */
class ToolRegistryClass {
  private tools: Map<ToolId, Tool> = new Map();

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Get a tool by ID
   */
  get(id: ToolId): Tool | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get all tool IDs
   */
  getIds(): ToolId[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get metadata for all tools (for UI)
   */
  getMetadata(): ToolMetadata[] {
    return this.getAll().map(tool => ({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      shortcut: tool.shortcut,
      cursor: tool.cursor,
      usesBrushSize: tool.usesBrushSize,
      usesBrushOpacity: tool.usesBrushOpacity,
      usesSymmetry: tool.usesSymmetry,
    }));
  }

  /**
   * Check if a tool is registered
   */
  has(id: ToolId): boolean {
    return this.tools.has(id);
  }

  /**
   * Get tool by keyboard shortcut
   */
  getByShortcut(shortcut: string): Tool | undefined {
    const upperShortcut = shortcut.toUpperCase();
    return this.getAll().find(t => t.shortcut.toUpperCase() === upperShortcut);
  }

  /**
   * Clear all registered tools (for testing)
   */
  clear(): void {
    this.tools.clear();
  }
}

// Singleton instance
export const ToolRegistry = new ToolRegistryClass();

// Tool groups for UI organization
export const TOOL_GROUPS = {
  drawing: ['pencil', 'eraser', 'line', 'fill', 'gradient', 'noise'] as ToolId[],
  utility: ['eyedropper', 'selection'] as ToolId[],
};

// Default tool
export const DEFAULT_TOOL: ToolId = 'pencil';
