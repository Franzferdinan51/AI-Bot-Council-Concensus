import fs from 'fs';
import path from 'path';
import { BotConfig } from '../types/index.js';

const CONFIG_DIR = path.join(process.cwd(), 'src', 'config');

export class ConfigLoader {
    private static loadJson(filename: string): any {
        try {
            const filePath = path.join(CONFIG_DIR, filename);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(content);
            }
            console.warn(`[ConfigLoader] Config file not found: ${filename}`);
            return {};
        } catch (error) {
            console.error(`[ConfigLoader] Error loading ${filename}:`, error);
            return {};
        }
    }

    static loadPrompts(): any {
        const data = this.loadJson('prompts.json');
        // Expand directives
        const directives = data.directives || {};
        const instructions = data.system_instructions || {};

        const expand = (obj: any): any => {
            if (typeof obj === 'string') {
                let expanded = obj;
                for (const [key, value] of Object.entries(directives)) {
                    expanded = expanded.replace(new RegExp(`{{${key.toUpperCase()}_DIRECTIVE}}`, 'g'), value as string);
                }
                return expanded;
            } else if (typeof obj === 'object' && obj !== null) {
                const result: any = Array.isArray(obj) ? [] : {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = expand(value);
                }
                return result;
            }
            return obj;
        };

        return expand(instructions);
    }

    static loadBots(): { defaultBots: BotConfig[], personaPresets: any[] } {
        const data = this.loadJson('bots.json');
        return {
            defaultBots: data.default_bots || [],
            personaPresets: data.persona_presets || []
        };
    }

    static loadModels(): { openRouterModels: string[], voiceMap: Record<string, string> } {
        const data = this.loadJson('models.json');
        return {
            openRouterModels: data.openrouter_models || [],
            voiceMap: data.voice_map || {}
        };
    }
}
