import { z } from 'zod';

export interface AgentTool {
    name: string;
    description: string;
    schema: z.ZodType<any>;
    execute(args: any): Promise<string>;
}
