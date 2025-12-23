// Types
export * from './types';

// Utilities
export * from './PaintTargetValidator';

// Base class
export { BaseTool } from './BaseTool';

// Registry
export { ToolRegistry, TOOL_GROUPS, DEFAULT_TOOL } from './ToolRegistry';

// Tools
export { PencilTool } from './tools/PencilTool';
export { EraserTool } from './tools/EraserTool';
export { EyedropperTool } from './tools/EyedropperTool';
export { FillTool } from './tools/FillTool';
export { LineTool } from './tools/LineTool';
export { GradientTool } from './tools/GradientTool';
export { NoiseTool } from './tools/NoiseTool';
export { SelectionTool } from './tools/SelectionTool';

// Initialize registry with all tools
import { ToolRegistry } from './ToolRegistry';
import { PencilTool } from './tools/PencilTool';
import { EraserTool } from './tools/EraserTool';
import { EyedropperTool } from './tools/EyedropperTool';
import { FillTool } from './tools/FillTool';
import { LineTool } from './tools/LineTool';
import { GradientTool } from './tools/GradientTool';
import { NoiseTool } from './tools/NoiseTool';
import { SelectionTool } from './tools/SelectionTool';

/**
 * Initialize the tool registry with all available tools
 * Call this once at application startup
 */
export function initializeTools(): void {
  ToolRegistry.register(new PencilTool());
  ToolRegistry.register(new EraserTool());
  ToolRegistry.register(new EyedropperTool());
  ToolRegistry.register(new FillTool());
  ToolRegistry.register(new LineTool());
  ToolRegistry.register(new GradientTool());
  ToolRegistry.register(new NoiseTool());
  ToolRegistry.register(new SelectionTool());
}

// Auto-initialize on import
initializeTools();
