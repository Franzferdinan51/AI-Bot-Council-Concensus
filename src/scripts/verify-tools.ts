import { CouncilOrchestrator } from '../services/councilOrchestrator.js';
import { AIService } from '../services/aiService.js';
import { sessionService } from '../services/sessionService.js';
import { SessionMode, BotConfig, Message } from '../types/index.js';
import { toolRegistry } from '../tools/agentTools/registry.js';
import { fileSystemTool } from '../tools/agentTools/fileSystem.js';

// Mock AI Service
class MockAIService extends AIService {
    constructor() {
        super({} as any); // Pass empty config
    }

    async streamBotResponse(
        bot: BotConfig,
        history: Message[],
        systemPrompt: string,
        onChunk: (chunk: string) => void
    ): Promise<string> {
        const response = 'I will list the files in the workspace.\n<tool_call>{"name": "file_system", "arguments": {"operation": "list"}}</tool_call>';
        onChunk(response);
        return response;
    }

    // Override other methods to avoid errors if called
    async getBotResponse() { return "Mock response"; }
}

async function verify() {
    console.log('--- Starting Tool Verification ---');

    // 1. Initialize
    await sessionService.initialize();
    const mockAI = new MockAIService();
    const orchestrator = new CouncilOrchestrator(mockAI);

    // 2. Create Session
    const sessionId = sessionService.createSession(
        'Tool Test',
        SessionMode.DELIBERATION,
        { bots: [{ id: 'bot1', name: 'Tester', role: 'councilor', enabled: true, authorType: 'gemini', model: 'gemini-pro', persona: 'tester', color: 'blue' }], providers: {} } as any
    );
    console.log(`Created session: ${sessionId}`);

    // 3. Run Session (which calls processBotTurn)
    // We'll use a simplified run or just rely on the fact that runCouncilSession calls processBotTurn
    // But runCouncilSession is complex.
    // We can try to access the private method via casting to any, or just run a short session mode.
    // INQUIRY mode is relatively short.

    console.log('Running session...');
    try {
        await orchestrator.runCouncilSession(
            sessionId,
            'Tool Test',
            SessionMode.INQUIRY, // Short mode
            {
                bots: [{ id: 'bot1', name: 'Tester', role: 'speaker', enabled: true, authorType: 'gemini', model: 'gemini-pro', persona: 'tester', color: 'blue' }],
                providers: {},
                verboseLogging: true
            } as any
        );
    } catch (e) {
        // Ignore errors from incomplete mocks
        console.log('Session finished (possibly with errors, checking results...)');
    }

    // 4. Verify Tool Output in Messages
    const session = sessionService.getSession(sessionId);
    if (!session) {
        console.error('FAILED: Session not found.');
        process.exit(1);
    }

    const messages = session.messages;
    const toolOutputMsg = messages.find(m => m.content.includes('[TOOL OUTPUT: file_system]'));

    if (toolOutputMsg) {
        console.log('SUCCESS: Found tool output in messages.');
        console.log('Content snippet:', toolOutputMsg.content.substring(0, 200));
    } else {
        console.error('FAILED: Tool output not found in messages.');
        console.log('Messages:', JSON.stringify(messages.map(m => m.content), null, 2));
        process.exit(1);
    }

    // Cleanup
    sessionService.deleteSession(sessionId);
    await sessionService.shutdown();
}

verify().catch(console.error);
