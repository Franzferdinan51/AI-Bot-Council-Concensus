import { AgentTool } from './base.js';

export class ToolRegistry {
    private tools: Map<string, AgentTool> = new Map();
    private static instance: ToolRegistry;

    private constructor() { }

    static getInstance(): ToolRegistry {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }

    registerTool(tool: AgentTool) {
        this.tools.set(tool.name, tool);
        console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
    }

    getTool(name: string): AgentTool | undefined {
        return this.tools.get(name);
    }

    getAllTools(): AgentTool[] {
        return Array.from(this.tools.values());
    }

    getToolDefinitions(): string {
        return this.getAllTools().map(tool => {
            // Convert Zod schema to JSON schema-like description
            // For simplicity, we'll just use a description string for now or implement a helper
            return `<tool_definition>
<name>${tool.name}</name>
<description>${tool.description}</description>
<parameters>
${this.describeSchema(tool.schema)}
</parameters>
</tool_definition>`;
        }).join('\n\n');
    }

    private describeSchema(schema: any): string {
        // Basic Zod to string description (can be improved)
        if (schema._def?.typeName === 'ZodObject') {
            const shape = schema._def.shape();
            return Object.entries(shape).map(([key, value]: [string, any]) => {
                return `  - ${key}: ${value._def?.description || value._def?.typeName}`;
            }).join('\n');
        }
        return '  (See documentation)';
    }
}

export const toolRegistry = ToolRegistry.getInstance();
