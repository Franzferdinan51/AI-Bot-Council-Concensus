import { createCouncilSessionTools, handleCouncilToolCall } from '../tools/councilSessionTools.js';
import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { AIService } from '../services/aiService.js';
import { DEFAULT_SETTINGS } from '../types/constants.js';

async function verify() {
    console.log('--- Verifying Diagnostics Tool ---');

    // Mock dependencies
    const mockAIService = {} as AIService;
    const mockOrchestrator = {} as CouncilOrchestrator;

    // We can't easily mock sessionService/logger as they are singletons imported directly in the tool file.
    // But we can run the tool and check the output structure.

    try {
        const result = await handleCouncilToolCall('council_diagnostics', { verbose: true }, mockOrchestrator);

        if (result.content && result.content[0] && result.content[0].type === 'text') {
            console.log('Diagnostics Output Preview:');
            console.log(result.content[0].text.substring(0, 500) + '...');

            const text = result.content[0].text;

            // Check for key sections
            const checks = [
                'AI COUNCIL MCP - DIAGNOSTICS',
                'API KEYS',
                'COUNCIL QUORUM',
                'SESSIONS',
                'LOGS'
            ];

            const missing = checks.filter(c => !text.includes(c));

            if (missing.length === 0) {
                console.log('SUCCESS: Diagnostics tool returned expected sections.');
            } else {
                console.error('FAIL: Diagnostics tool missing sections:', missing);
                process.exit(1);
            }
        } else {
            console.error('FAIL: No content returned from diagnostics tool');
            process.exit(1);
        }
    } catch (error) {
        console.error('FAIL: Error running diagnostics tool:', error);
        process.exit(1);
    }
}

verify().catch(console.error);
