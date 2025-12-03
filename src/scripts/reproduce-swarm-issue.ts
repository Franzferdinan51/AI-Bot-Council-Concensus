import { sessionService } from '../services/sessionService.js';
import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { AIService } from '../services/aiService.js';
import { SessionMode } from '../types/index.js';
import { DEFAULT_SETTINGS } from '../types/constants.js';

async function reproduce() {
    console.log('--- Reproducing Swarm Coding Issue (Real AI) ---');

    await sessionService.initialize();

    const aiService = new AIService(DEFAULT_SETTINGS.providers);
    const orchestrator = new CouncilOrchestrator(aiService);

    const sessionId = sessionService.createSession(
        'Swarm Test',
        SessionMode.SWARM_CODING,
        DEFAULT_SETTINGS
    );

    console.log(`Created session: ${sessionId}`);
    console.log('Running Swarm Coding session...');

    try {
        await orchestrator.runCouncilSession(
            sessionId,
            'Create a simple "Hello World" Python script',
            SessionMode.SWARM_CODING,
            DEFAULT_SETTINGS
        );
    } catch (e) {
        console.error('Session failed:', e);
    }

    const session = sessionService.getSession(sessionId);
    if (session) {
        console.log(`Session Status: ${session.status}`);
        console.log(`Message Count: ${session.messages.length}`);
        console.log('Messages:');
        session.messages.forEach(m => {
            console.log(`[${m.author}]: ${m.content.substring(0, 100)}...`);
        });
    }

    await sessionService.shutdown();
}

reproduce().catch(console.error);
