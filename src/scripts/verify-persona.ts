import { personaSuggestionService } from '../services/personaSuggestionService.js';
import { AIService } from '../services/aiService.js';
import { DEFAULT_SETTINGS } from '../types/constants.js';
import { AuthorType } from '../types/index.js';

async function verify() {
    console.log('--- Verifying Persona Suggestion ---');

    // Mock AIService
    const mockAIService = {
        getBotResponse: async () => {
            console.log('MOCK: getBotResponse called');
            return JSON.stringify({
                suggestions: [
                    { botId: 'specialist-science', confidence: 0.9, reasoning: 'Expert in science' },
                    { botId: 'councilor-technocrat', confidence: 0.8, reasoning: 'Tech expert' }
                ],
                reasoning: 'Selected based on science topic'
            });
        }
    } as unknown as AIService;

    personaSuggestionService.setAIService(mockAIService);

    const result = await personaSuggestionService.suggestPersonas({
        topic: 'Quantum Physics',
        mode: 'Research'
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.suggestions.length > 0 && result.reasoning === 'Selected based on science topic') {
        console.log('SUCCESS: Persona suggestion used AI service');
    } else {
        console.error('FAIL: Persona suggestion did not use AI service');
        process.exit(1);
    }
}

verify().catch(console.error);
