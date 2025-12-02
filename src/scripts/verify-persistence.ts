import { sessionService } from '../services/sessionService.js';
import { SessionMode, SessionStatus, AuthorType } from '../types/index.js';
import { sqliteStorage } from '../services/sqliteStorageService.js';

async function verify() {
    console.log('--- Starting Persistence Verification ---');

    // 1. Initialize Service
    await sessionService.initialize();

    // 2. Create a Session
    const sessionId = sessionService.createSession(
        'Persistence Test',
        SessionMode.DELIBERATION,
        { bots: [], providers: {} } as any,
        'Testing if data survives.'
    );
    console.log(`Created session: ${sessionId}`);

    // 3. Add a Message
    sessionService.addMessage(sessionId, {
        author: 'Tester',
        authorType: AuthorType.HUMAN,
        content: 'This message should persist.',
        roleLabel: 'User'
    });
    console.log('Added message.');

    // 4. Force Save (wait a bit for async save if needed, though we made it fire-and-forget)
    // Since we don't have a way to await the specific save in public API, we wait a moment.
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Shutdown
    await sessionService.shutdown();
    console.log('Service shutdown.');

    // 6. Re-initialize (Simulate restart)
    // We need to reset the singleton state or just use storage service directly to verify
    // But sessionService is a singleton. We can re-call initialize() after shutdown() as it sets initialized=false.

    console.log('Restarting service...');
    await sessionService.initialize();

    // 7. Load Session
    const loadedSession = sessionService.getSession(sessionId);

    if (!loadedSession) {
        console.error('FAILED: Session not found after restart.');
        process.exit(1);
    }

    if (loadedSession.messages.length !== 2) { // Init + 1 added
        console.error(`FAILED: Expected 2 messages, found ${loadedSession.messages.length}`);
        process.exit(1);
    }

    const lastMsg = loadedSession.messages[loadedSession.messages.length - 1];
    if (lastMsg.content !== 'This message should persist.') {
        console.error('FAILED: Message content mismatch.');
        process.exit(1);
    }

    console.log('SUCCESS: Session and messages persisted correctly.');

    // Cleanup
    sessionService.deleteSession(sessionId);
    await sessionService.shutdown();
}

verify().catch(console.error);
