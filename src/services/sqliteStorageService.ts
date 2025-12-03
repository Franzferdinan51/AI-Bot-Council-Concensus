import { DatabaseService } from './databaseService.js';
import { CouncilSession, Message, VoteData, PredictionData, CodeFile, SessionStatus } from '../types/index.js';

export class SQLiteStorageService {
    private dbService: DatabaseService;

    constructor() {
        this.dbService = DatabaseService.getInstance();
    }

    async initialize(): Promise<void> {
        // DatabaseService initializes schema in constructor
        return Promise.resolve();
    }

    async loadAllSessions(): Promise<CouncilSession[]> {
        const db = this.dbService.getDb();
        const rows = db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all() as any[];

        const sessions: CouncilSession[] = [];
        for (const row of rows) {
            const session = await this.hydrateSession(row);
            sessions.push(session);
        }

        return sessions;
    }

    async loadSession(sessionId: string): Promise<CouncilSession | null> {
        const db = this.dbService.getDb();
        const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;

        if (!row) return null;

        return this.hydrateSession(row);
    }

    async saveSession(session: CouncilSession): Promise<void> {
        const db = this.dbService.getDb();

        const insertSession = db.prepare(`
      INSERT OR REPLACE INTO sessions (id, topic, mode, status, created_at, updated_at, settings, context)
      VALUES (@id, @topic, @mode, @status, @createdAt, @updatedAt, @settings, @context)
    `);

        const insertMessage = db.prepare(`
      INSERT OR REPLACE INTO messages (id, session_id, author, author_type, content, timestamp, attachments)
      VALUES (@id, @sessionId, @author, @authorType, @content, @timestamp, @attachments)
    `);

        const insertVote = db.prepare(`
      INSERT OR REPLACE INTO votes (session_id, topic, result, yeas, nays, abstains, avg_confidence, consensus_score, consensus_label, votes)
      VALUES (@sessionId, @topic, @result, @yeas, @nays, @abstains, @avgConfidence, @consensusScore, @consensusLabel, @votes)
    `);

        const insertPrediction = db.prepare(`
      INSERT OR REPLACE INTO predictions (session_id, outcome, confidence, timeline, reasoning, factors)
      VALUES (@sessionId, @outcome, @confidence, @timeline, @reasoning, @factors)
    `);

        const insertCodeFile = db.prepare(`
      INSERT OR REPLACE INTO code_files (id, session_id, filename, language, content, description)
      VALUES (@id, @sessionId, @filename, @language, @content, @description)
    `);

        const transaction = db.transaction(() => {
            // Save Session
            insertSession.run({
                id: session.id,
                topic: session.topic,
                mode: session.mode,
                status: session.status,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                settings: JSON.stringify(session.settings),
                context: typeof (session as any).context === 'object' ? JSON.stringify((session as any).context) : ((session as any).context || null)
            });

            // Save Messages (Optimized: only new or updated ones ideally, but REPLACE handles it)
            for (const msg of session.messages) {
                insertMessage.run({
                    id: msg.id,
                    sessionId: session.id,
                    author: msg.author,
                    authorType: msg.authorType,
                    content: msg.content,
                    timestamp: msg.timestamp,
                    attachments: JSON.stringify(msg.attachments || [])
                });
            }

            // Save Votes
            if (session.voteData) {
                insertVote.run({
                    sessionId: session.id,
                    topic: session.voteData.topic,
                    result: session.voteData.result,
                    yeas: session.voteData.yeas,
                    nays: session.voteData.nays,
                    abstains: session.voteData.abstains || 0,
                    avgConfidence: session.voteData.avgConfidence,
                    consensusScore: session.voteData.consensusScore,
                    consensusLabel: session.voteData.consensusLabel,
                    votes: JSON.stringify(session.voteData.votes)
                });
            }

            // Save Prediction
            if (session.predictionData) {
                insertPrediction.run({
                    sessionId: session.id,
                    outcome: session.predictionData.outcome,
                    confidence: session.predictionData.confidence,
                    timeline: session.predictionData.timeline,
                    reasoning: session.predictionData.reasoning,
                    factors: JSON.stringify(session.predictionData.factors || [])
                });
            }

            // Save Code Files
            if (session.codeFiles) {
                for (const file of session.codeFiles) {
                    insertCodeFile.run({
                        id: `${session.id}-${file.filename}`, // Simple composite ID
                        sessionId: session.id,
                        filename: file.filename,
                        language: file.language,
                        content: file.content,
                        description: file.description
                    });
                }
            }
        });

        transaction();
    }

    async deleteSession(sessionId: string): Promise<void> {
        const db = this.dbService.getDb();
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
        // Cascade delete handles related tables
    }

    /**
     * Schedule a save (Debounced or immediate)
     * For SQLite, we can just save immediately as it's fast.
     */
    scheduleSave(sessionId: string, session: CouncilSession): void {
        // Fire and forget, but catch errors
        this.saveSession(session).catch(err => {
            console.error(`[SQLiteStorage] Failed to save session ${sessionId}:`, err);
        });
    }

    private async hydrateSession(row: any): Promise<CouncilSession> {
        const db = this.dbService.getDb();

        // Load Messages
        const messages = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(row.id) as any[];
        const hydratedMessages: Message[] = messages.map(m => ({
            id: m.id,
            author: m.author,
            authorType: m.author_type,
            content: m.content,
            timestamp: m.timestamp,
            attachments: JSON.parse(m.attachments || '[]')
        }));

        // Load Votes
        const voteRow = db.prepare('SELECT * FROM votes WHERE session_id = ?').get(row.id) as any;
        let voteData: VoteData | undefined;
        if (voteRow) {
            voteData = {
                topic: voteRow.topic,
                result: voteRow.result,
                yeas: voteRow.yeas,
                nays: voteRow.nays,
                abstains: voteRow.abstains,
                avgConfidence: voteRow.avg_confidence,
                consensusScore: voteRow.consensus_score,
                consensusLabel: voteRow.consensus_label,
                votes: JSON.parse(voteRow.votes || '[]')
            };
        }

        // Load Prediction
        const predictionRow = db.prepare('SELECT * FROM predictions WHERE session_id = ?').get(row.id) as any;
        let predictionData: PredictionData | undefined;
        if (predictionRow) {
            predictionData = {
                outcome: predictionRow.outcome,
                confidence: predictionRow.confidence,
                timeline: predictionRow.timeline,
                reasoning: predictionRow.reasoning,
                factors: JSON.parse(predictionRow.factors || '[]')
            };
        }

        // Load Code Files
        const codeRows = db.prepare('SELECT * FROM code_files WHERE session_id = ?').all(row.id) as any[];
        const codeFiles: CodeFile[] = codeRows.map(c => ({
            filename: c.filename,
            language: c.language,
            content: c.content,
            description: c.description
        }));

        return {
            id: row.id,
            topic: row.topic,
            mode: row.mode,
            status: row.status as SessionStatus,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            settings: JSON.parse(row.settings || '{}'),
            messages: hydratedMessages,
            voteData,
            predictionData,
            codeFiles: codeFiles.length > 0 ? codeFiles : undefined
        };
    }

    async shutdown(): Promise<void> {
        this.dbService.close();
    }
}

export const sqliteStorage = new SQLiteStorageService();
