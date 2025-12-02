import { CouncilSession, Message, SessionMode, SessionStatus, VoteData, PredictionData, CodeFile, Attachment, AuthorType } from '../types/index.js';
import { sqliteStorage } from './sqliteStorageService.js';

export class SessionService {
  private sessions: Map<string, CouncilSession> = new Map();
  private initialized = false;

  /**
   * Initialize the session service and load persisted sessions
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await sqliteStorage.initialize();
    const persistedSessions = await sqliteStorage.loadAllSessions();

    // Add persisted sessions to in-memory cache
    for (const session of persistedSessions) {
      this.sessions.set(session.id, session);
    }

    this.initialized = true;
    console.log(`[SessionService] Initialized with ${persistedSessions.length} persisted sessions (SQLite)`);
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('SessionService not initialized. Call initialize() first.');
    }
  }

  createSession(
    topic: string,
    mode: SessionMode,
    settings: any,
    context?: string,
    userPrompt?: string,
    attachments?: Attachment[]
  ): string {
    this.ensureInitialized();

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.error(`[SessionService] Creating session ${sessionId} - Mode: ${mode}, User Participation: ${userPrompt ? 'Yes' : 'No'}`);

    const messages: Message[] = [];

    // Add user prompt if provided (the controlling bot is participating)
    if (userPrompt) {
      console.error(`[SessionService] Adding user prompt to session: "${userPrompt.substring(0, 100)}..."`);
      messages.push({
        id: `user-${Date.now()}`,
        author: 'User',
        authorType: AuthorType.HUMAN,
        content: userPrompt,
        timestamp: Date.now()
      });
    }

    // Add initial message (topic/context)
    messages.push({
      id: `init-${Date.now()}`,
      author: 'Petitioner',
      authorType: AuthorType.HUMAN,
      content: context || topic,
      timestamp: Date.now(),
      attachments
    });

    const session: CouncilSession = {
      id: sessionId,
      topic,
      mode,
      status: SessionStatus.IDLE,
      messages,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sessions.set(sessionId, session);

    // Persist immediately
    sqliteStorage.saveSession(session).catch(err => {
      console.error(`[SessionService] Failed to save new session:`, err);
    });

    return sessionId;
  }

  getSession(sessionId: string): CouncilSession | undefined {
    return this.sessions.get(sessionId);
  }

  updateSessionStatus(sessionId: string, status: SessionStatus): void {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.updatedAt = Date.now();

      console.error(`[AI Council MCP] [SESSION] ${sessionId} status -> ${status}`);
      // Schedule auto-save
      sqliteStorage.scheduleSave(sessionId, session);
    }
  }

  addMessage(sessionId: string, message: Omit<Message, 'id' | 'timestamp'>): Message {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const fullMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    session.messages.push(fullMessage);
    session.updatedAt = Date.now();

    console.error(`[AI Council MCP] [MESSAGE] ${sessionId} author=${fullMessage.author} type=${fullMessage.authorType}`);
    // Schedule auto-save
    sqliteStorage.scheduleSave(sessionId, session);

    return fullMessage;
  }

  updateMessage(sessionId: string, messageId: string, updates: Partial<Message>): void {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messageIndex = session.messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      session.messages[messageIndex] = {
        ...session.messages[messageIndex],
        ...updates
      };
      session.updatedAt = Date.now();

      console.error(`[AI Council MCP] [MESSAGE-UPDATE] ${sessionId} message=${messageId}`);
      // Schedule auto-save
      sqliteStorage.scheduleSave(sessionId, session);
    }
  }

  setVoteData(sessionId: string, voteData: VoteData): void {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (session) {
      session.voteData = voteData;
      session.updatedAt = Date.now();

      // Schedule auto-save
      sqliteStorage.scheduleSave(sessionId, session);
    }
  }

  setPredictionData(sessionId: string, predictionData: PredictionData): void {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (session) {
      session.predictionData = predictionData;
      session.updatedAt = Date.now();

      // Schedule auto-save
      sqliteStorage.scheduleSave(sessionId, session);
    }
  }

  setCodeFiles(sessionId: string, codeFiles: CodeFile[]): void {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (session) {
      session.codeFiles = codeFiles;
      session.updatedAt = Date.now();

      // Schedule auto-save
      sqliteStorage.scheduleSave(sessionId, session);
    }
  }

  listSessions(): CouncilSession[] {
    this.ensureInitialized();

    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
  }

  deleteSession(sessionId: string): boolean {
    this.ensureInitialized();

    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      // Also delete from disk
      sqliteStorage.deleteSession(sessionId).catch(err => {
        console.error(`[SessionService] Failed to delete session from disk:`, err);
      });
    }
    return deleted;
  }

  stopSession(sessionId: string): void {
    this.updateSessionStatus(sessionId, SessionStatus.ADJOURNED);
  }

  pauseSession(sessionId: string): void {
    this.updateSessionStatus(sessionId, SessionStatus.PAUSED);
  }

  resumeSession(sessionId: string): void {
    this.updateSessionStatus(sessionId, SessionStatus.DEBATING);
  }

  getSessionSummary(sessionId: string): string {
    this.ensureInitialized();

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messageCount = session.messages.length;
    const participants = new Set(
      session.messages.map(m => m.author)
    ).size;

    let summary = `Council Session: ${session.topic}\n`;
    summary += `Mode: ${session.mode}\n`;
    summary += `Status: ${session.status}\n`;
    summary += `Messages: ${messageCount}\n`;
    summary += `Participants: ${participants}\n`;

    if (session.voteData) {
      summary += `\nVoting Results:\n`;
      summary += `  Result: ${session.voteData.result}\n`;
      summary += `  Yeas: ${session.voteData.yeas}, Nays: ${session.voteData.nays}\n`;
      summary += `  Consensus: ${session.voteData.consensusLabel} (${session.voteData.consensusScore}%)\n`;
    }

    if (session.predictionData) {
      summary += `\nPrediction:\n`;
      summary += `  Outcome: ${session.predictionData.outcome}\n`;
      summary += `  Confidence: ${session.predictionData.confidence}%\n`;
      summary += `  Timeline: ${session.predictionData.timeline}\n`;
    }

    if (session.codeFiles && session.codeFiles.length > 0) {
      summary += `\nCode Files Generated: ${session.codeFiles.length}\n`;
      session.codeFiles.forEach((file, idx) => {
        summary += `  ${idx + 1}. ${file.filename} (${file.language})\n`;
      });
    }

    return summary;
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    console.log('[SessionService] Shutting down...');
    await sqliteStorage.shutdown();
    this.sessions.clear();
    this.initialized = false;
    console.log('[SessionService] Shutdown complete');
  }
}

export const sessionService = new SessionService();
