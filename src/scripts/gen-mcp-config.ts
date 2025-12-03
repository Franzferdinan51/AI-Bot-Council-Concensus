import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const outputPath = path.join(rootDir, 'mcp.json');
const serverPath = path.join(rootDir, 'dist', 'index.js');

const mcpConfig = {
  mcpServers: {
    'ai-council': {
      command: 'node',
      args: [serverPath],
      env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? '',
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? '',
        GENERIC_OPENAI_API_KEY: process.env.GENERIC_OPENAI_API_KEY ?? '',
        GENERIC_OPENAI_ENDPOINT: process.env.GENERIC_OPENAI_ENDPOINT ?? '',
        LM_STUDIO_ENDPOINT: process.env.LM_STUDIO_ENDPOINT ?? '',
        OLLAMA_ENDPOINT: process.env.OLLAMA_ENDPOINT ?? '',
        MAX_CONCURRENT_REQUESTS: process.env.MAX_CONCURRENT_REQUESTS ?? '2',
        ECONOMY_MODE: process.env.ECONOMY_MODE ?? 'true'
      }
    }
  }
};

fs.writeFileSync(outputPath, JSON.stringify(mcpConfig, null, 2));
console.log(`[mcp.json] generated at ${outputPath}`);

