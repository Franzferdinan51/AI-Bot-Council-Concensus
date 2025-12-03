import { z } from 'zod';
import { AgentTool } from './base.js';
import { search, SafeSearchType } from 'duck-duck-scrape';

export const webSearchTool: AgentTool = {
    name: 'web_search',
    description: 'Search the web for information. Use this to find current events, documentation, or facts.',
    schema: z.object({
        query: z.string().describe('The search query')
    }),
    execute: async (args: any) => {
        const { query } = args;
        const provider = (process.env.SEARCH_PROVIDER || 'duckduckgo').toLowerCase();

        try {
            const tavilyKey = process.env.TAVILY_API_KEY;
            const braveKey = process.env.BRAVE_API_KEY;
            const serperKey = process.env.SERPER_API_KEY;

            // Brave Search
            if (provider === 'brave') {
                if (!braveKey) throw new Error("BRAVE_API_KEY is not set.");

                const response = await fetch('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(query), {
                    headers: {
                        'Accept': 'application/json',
                        'X-Subscription-Token': braveKey
                    }
                });

                if (!response.ok) {
                    throw new Error(`Brave API error: ${response.statusText}`);
                }

                const data = await response.json() as any;
                const snippets = data.web?.results?.slice(0, 5).map((r: any) => `- ${r.title}: ${r.url}\n  ${r.description}`).join('\n\n') || "No results.";
                return `Brave Search Results for "${query}":\n\n${snippets}`;
            }

            // Tavily
            if (provider === 'tavily') {
                if (!tavilyKey) throw new Error("TAVILY_API_KEY is not set.");

                const response = await fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: tavilyKey,
                        query: query,
                        search_depth: 'basic',
                        include_answer: true
                    })
                });

                if (!response.ok) throw new Error(`Tavily API error: ${response.statusText}`);

                const data = await response.json() as any;
                return `Tavily Search Results for "${query}":\n\n${data.answer || ''}\n\nSources:\n${data.results.map((r: any) => `- ${r.title}: ${r.url}`).join('\n')}`;
            }

            // Serper
            if (provider === 'serper') {
                if (!serperKey) throw new Error("SERPER_API_KEY is not set.");

                const response = await fetch('https://google.serper.dev/search', {
                    method: 'POST',
                    headers: {
                        'X-API-KEY': serperKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ q: query })
                });

                if (!response.ok) throw new Error(`Serper API error: ${response.statusText}`);

                const data = await response.json() as any;
                const snippets = data.organic.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n');
                return `Serper Search Results for "${query}":\n\n${snippets}`;
            }

            // Default: DuckDuckGo (via library or fallback)
            if (provider === 'duckduckgo') {
                const results = await search(query, { safeSearch: SafeSearchType.STRICT });
                if (!results.results.length) return "No results found.";

                return `DuckDuckGo Results for "${query}":\n\n` +
                    results.results.slice(0, 5).map(r => `- ${r.title}: ${r.url}\n  ${r.description}`).join('\n\n');
            }

            return `Error: Unknown search provider '${provider}'. Supported: duckduckgo, brave, tavily, serper.`;

        } catch (error) {
            const err = error as Error;
            return `Search Error (${provider}): ${err.message}`;
        }
    }
};
