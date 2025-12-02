import { toolRegistry } from './registry.js';
import { fileSystemTool } from './fileSystem.js';
import { webSearchTool } from './webSearch.js';

export function registerAgentTools() {
    toolRegistry.registerTool(fileSystemTool);
    toolRegistry.registerTool(webSearchTool);
    console.log('[AgentTools] Core tools registered');
}
