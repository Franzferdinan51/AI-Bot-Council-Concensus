import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { AgentTool } from './base.js';

const SANDBOX_DIR = path.join(process.cwd(), 'workspace');

// Ensure sandbox exists
fs.mkdir(SANDBOX_DIR, { recursive: true }).catch(console.error);

export const fileSystemTool: AgentTool = {
    name: 'file_system',
    description: 'Read and write files in the workspace directory. Use this to save code, read data, or list files.',
    schema: z.object({
        operation: z.enum(['read', 'write', 'list']).describe('The operation to perform'),
        path: z.string().describe('The file path relative to workspace (e.g., "code.py")').optional(),
        content: z.string().describe('The content to write (required for write operation)').optional()
    }),
    execute: async (args: any) => {
        const { operation, path: filePath, content } = args;

        try {
            if (operation === 'list') {
                const files = await fs.readdir(SANDBOX_DIR);
                return `Files in workspace:\n${files.join('\n')}`;
            }

            if (!filePath) {
                throw new Error('Path is required for read/write operations');
            }

            // Security check: Prevent directory traversal
            const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
            const fullPath = path.join(SANDBOX_DIR, safePath);

            if (!fullPath.startsWith(SANDBOX_DIR)) {
                throw new Error('Access denied: Path is outside sandbox');
            }

            if (operation === 'read') {
                const data = await fs.readFile(fullPath, 'utf-8');
                return data;
            }

            if (operation === 'write') {
                if (content === undefined) {
                    throw new Error('Content is required for write operation');
                }
                await fs.writeFile(fullPath, content, 'utf-8');
                return `Successfully wrote to ${safePath}`;
            }

            return 'Unknown operation';
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }
};
