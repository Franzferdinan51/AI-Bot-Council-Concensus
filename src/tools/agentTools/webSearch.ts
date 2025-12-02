import { z } from 'zod';
import { AgentTool } from './base.js';

export const webSearchTool: AgentTool = {
    name: 'web_search',
    description: 'Search the web for information. Use this to find current events, documentation, or facts.',
    schema: z.object({
        query: z.string().describe('The search query')
    }),
    execute: async (args: any) => {
        const { query } = args;
        const tavilyKey = process.env.TAVILY_API_KEY;
        const serperKey = process.env.SERPER_API_KEY;

        try {
            if (tavilyKey) {
                const response = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query: query,
                        search_depth: 'basic',
                        include_answer: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`Tavily API error: ${response.statusText}`);
                }

                const data = await response.json() as any;
                return `Search Results for "${query}":\n\n${data.answer || ''}\n\nSources:\n${data.results.map((r: any) => `- ${r.title}: ${r.url}`).join('\n')}`;
            } else if (serperKey) {
                const response = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        q: query
                    })
                });

                if (!response.ok) {
                    throw new Error(`Serper API error: ${response.statusText}`);
                }

                const data = await response.json() as any;
                const snippets = data.organic.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n');
                return `Search Results for "${query}":\n\n${snippets}`;
            } else {
                return `[Mock Search Result] No API key configured for Tavily or Serper.
        Simulated result for: "${query}"
        - Result 1: Information about ${query}
        - Result 2: More details on ${query}`;
            }
        } catch (error: any) {
            return `Search Error: ${error.message}`;
        }
    }
};
