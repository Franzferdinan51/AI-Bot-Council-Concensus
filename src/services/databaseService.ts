import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private db: Database.Database;
  private static instance: DatabaseService;

  private constructor() {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'council.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.initializeSchema();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  getDb(): Database.Database {
    if (!this.db || !this.db.open) {
      const dataDir = path.join(process.cwd(), 'data');
      const dbPath = path.join(dataDir, 'council.db');
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
    }
    return this.db;
  }

  private initializeSchema() {
    // Sessions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        settings JSON,
        context TEXT
      )
    `);

    // Messages Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        author TEXT NOT NULL,
        author_type TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        attachments JSON,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Votes Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        session_id TEXT PRIMARY KEY,
        topic TEXT,
        result TEXT,
        yeas INTEGER,
        nays INTEGER,
        abstains INTEGER,
        avg_confidence INTEGER,
        consensus_score INTEGER,
        consensus_label TEXT,
        votes JSON,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Predictions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        session_id TEXT PRIMARY KEY,
        outcome TEXT,
        confidence INTEGER,
        timeline TEXT,
        reasoning TEXT,
        factors JSON,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Code Files Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS code_files (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);
    `);

    console.log('[DatabaseService] Schema initialized');
  }

  close() {
    if (this.db && this.db.open) {
      this.db.close();
    }
  }
}

export const databaseService = DatabaseService.getInstance();
