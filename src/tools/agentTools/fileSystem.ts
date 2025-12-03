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
        content: z.string().describe('The content to write (required for write operation)').optional(),
        lineStart: z.number().describe('Start line for partial read (1-indexed)').optional(),
        lineEnd: z.number().describe('End line for partial read (1-indexed)').optional()
    }),
    execute: async (args: any) => {
        const { operation, path: filePath, content, lineStart, lineEnd } = args;

        try {
            if (operation === 'list') {
                const files = await fs.readdir(SANDBOX_DIR);
                const fileDetails = await Promise.all(files.map(async (file) => {
                    const stats = await fs.stat(path.join(SANDBOX_DIR, file));
                    return `${file} (${stats.isDirectory() ? 'DIR' : 'FILE'}, ${stats.size} bytes, ${stats.mtime.toISOString()})`;
                }));
                console.error(`[FileSystem] Listed ${files.length} files`);
                return `Files in workspace:\n${fileDetails.join('\n')}`;
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

                if (lineStart !== undefined || lineEnd !== undefined) {
                    const lines = data.split('\n');
                    const start = (lineStart || 1) - 1;
                    const end = lineEnd || lines.length;
                    const partial = lines.slice(start, end).join('\n');
                    console.error(`[FileSystem] Read partial file: ${safePath} (lines ${start + 1}-${end})`);
                    return partial;
                }

                console.error(`[FileSystem] Read file: ${safePath}`);
                return data;
            }

            if (operation === 'write') {
                if (content === undefined) {
                    throw new Error('Content is required for write operation');
                }

                // Create backup if file exists
                try {
                    await fs.access(fullPath);
                    const backupPath = `${fullPath}.bak`;
                    await fs.copyFile(fullPath, backupPath);
                    console.error(`[FileSystem] Created backup: ${safePath}.bak`);
                } catch (e) {
                    // File doesn't exist, no backup needed
                }

                await fs.writeFile(fullPath, content, 'utf-8');
                console.error(`[FileSystem] Wrote to file: ${safePath}`);
                return `Successfully wrote to ${safePath}`;
            }

            return 'Unknown operation';
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    }
};
