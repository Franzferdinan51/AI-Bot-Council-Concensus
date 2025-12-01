/**
 * Session Storage Service
 * Handles persistence of session data to disk
 */

import fs from 'fs/promises';
import path from 'path';
import { CouncilSession, Message, VoteData, PredictionData, CodeFile } from '../types/index.js';

export interface SessionStorageConfig {
  storageDir: string;
  autoSave: boolean;
  saveInterval: number; // in seconds
  compressionEnabled: boolean;
  backupOnSave: boolean;
}

export class SessionStorageService {
  private static instance: SessionStorageService;
  private config: SessionStorageConfig;
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private sessions: Map<string, CouncilSession> = new Map();

  private constructor() {
    this.config = {
      storageDir: process.env.SESSION_STORAGE_DIR || path.join(process.cwd(), 'data', 'sessions'),
      autoSave: true,
      saveInterval: 30, // Auto-save every 30 seconds
      compressionEnabled: false,
      backupOnSave: true
    };
  }

  static getInstance(): SessionStorageService {
    if (!SessionStorageService.instance) {
      SessionStorageService.instance = new SessionStorageService();
    }
    return SessionStorageService.instance;
  }

  /**
   * Initialize the storage service
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      console.log(`[SessionStorage] Initialized at ${this.config.storageDir}`);
    } catch (error: any) {
      console.error('[SessionStorage] Failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Load all sessions from disk
   */
  async loadAllSessions(): Promise<CouncilSession[]> {
    try {
      const files = await fs.readdir(this.config.storageDir);
      const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));

      const sessions: CouncilSession[] = [];
      for (const file of sessionFiles) {
        try {
          const sessionPath = path.join(this.config.storageDir, file);
          const data = await fs.readFile(sessionPath, 'utf-8');
          const session = JSON.parse(data) as CouncilSession;
          sessions.push(session);
          this.sessions.set(session.id, session);
          console.log(`[SessionStorage] Loaded session: ${session.id}`);
        } catch (error: any) {
          console.error(`[SessionStorage] Failed to load ${file}:`, error.message);
        }
      }

      console.log(`[SessionStorage] Loaded ${sessions.length} sessions from disk`);
      return sessions;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.log('[SessionStorage] No sessions directory found, starting fresh');
        return [];
      }
      throw error;
    }
  }

  /**
   * Save a session to disk
   */
  async saveSession(session: CouncilSession, options?: { immediate?: boolean; backup?: boolean }): Promise<void> {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      const sessionPath = this.getSessionPath(session.id);

      // Create backup if enabled
      if (this.config.backupOnSave && options?.backup !== false) {
        await this.createBackup(session.id);
      }

      const data = JSON.stringify(session, null, 2);
      await fs.writeFile(sessionPath, data, 'utf-8');

      // Update in-memory cache
      this.sessions.set(session.id, { ...session });

      console.log(`[SessionStorage] Saved session: ${session.id}`);
    } catch (error: any) {
      console.error(`[SessionStorage] Failed to save session ${session.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Save session with debouncing
   */
  scheduleSave(sessionId: string, session: CouncilSession): void {
    if (!this.config.autoSave) {
      return;
    }

    // Clear existing timer
    const existingTimer = this.saveTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule new save
    const timer = setTimeout(async () => {
      try {
        await this.saveSession(session, { immediate: true, backup: false });
      } catch (error) {
        console.error(`[SessionStorage] Auto-save failed for ${sessionId}:`, error);
      } finally {
        this.saveTimers.delete(sessionId);
      }
    }, this.config.saveInterval * 1000);

    this.saveTimers.set(sessionId, timer);
  }

  /**
   * Load a specific session
   */
  async loadSession(sessionId: string): Promise<CouncilSession | null> {
    // Check in-memory cache first
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    try {
      const sessionPath = this.getSessionPath(sessionId);
      const data = await fs.readFile(sessionPath, 'utf-8');
      const session = JSON.parse(data) as CouncilSession;
      this.sessions.set(sessionId, session);
      return session;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a session from disk
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      await fs.unlink(sessionPath);
      this.sessions.delete(sessionId);

      // Clear any pending saves
      const timer = this.saveTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        this.saveTimers.delete(sessionId);
      }

      console.log(`[SessionStorage] Deleted session: ${sessionId}`);
    } catch (error: any) {
      console.error(`[SessionStorage] Failed to delete session ${sessionId}:`, error.message);
      throw error;
    }
  }

  /**
   * List all session IDs
   */
  listSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get session statistics
   */
  getStorageStats(): {
    totalSessions: number;
    totalSize: number;
    oldestSession?: string;
    newestSession?: string;
  } {
    let oldestTime = Infinity;
    let newestTime = -Infinity;
    let oldestId = '';
    let newestId = '';

    for (const [id, session] of this.sessions.entries()) {
      if (session.createdAt < oldestTime) {
        oldestTime = session.createdAt;
        oldestId = id;
      }
      if (session.createdAt > newestTime) {
        newestTime = session.createdAt;
        newestId = id;
      }
    }

    return {
      totalSessions: this.sessions.size,
      totalSize: 0, // Would need to read actual files to calculate
      oldestSession: oldestId || undefined,
      newestSession: newestId || undefined
    };
  }

  /**
   * Clean up old sessions
   */
  async cleanupOldSessions(maxAgeDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.createdAt < cutoffTime && session.status === 'adjourned') {
        await this.deleteSession(id);
        deletedCount++;
      }
    }

    console.log(`[SessionStorage] Cleaned up ${deletedCount} old sessions`);
    return deletedCount;
  }

  /**
   * Export session to JSON string
   */
  exportSession(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    return Promise.resolve(JSON.stringify(session, null, 2));
  }

  /**
   * Import session from JSON
   */
  async importSession(sessionData: string): Promise<CouncilSession> {
    try {
      const session = JSON.parse(sessionData) as CouncilSession;
      await this.saveSession(session, { backup: false });
      return session;
    } catch (error: any) {
      throw new Error(`Failed to import session: ${error.message}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SessionStorageConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('[SessionStorage] Configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): SessionStorageConfig {
    return { ...this.config };
  }

  /**
   * Shutdown and clean up
   */
  async shutdown(): Promise<void> {
    console.log('[SessionStorage] Shutting down...');

    // Save all pending sessions
    const savePromises: Promise<void>[] = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      const timer = this.saveTimers.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        savePromises.push(this.saveSession(session, { immediate: true, backup: false }));
      }
    }

    if (savePromises.length > 0) {
      await Promise.all(savePromises);
      console.log(`[SessionStorage] Saved ${savePromises.length} pending sessions`);
    }

    // Clear all timers
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();

    console.log('[SessionStorage] Shutdown complete');
  }

  /**
   * Get the file path for a session
   */
  private getSessionPath(sessionId: string): string {
    return path.join(this.config.storageDir, `${sessionId}.json`);
  }

  /**
   * Create a backup of a session
   */
  private async createBackup(sessionId: string): Promise<void> {
    try {
      const sessionPath = this.getSessionPath(sessionId);
      const backupPath = `${sessionPath}.bak`;
      // Only back up if the session file already exists
      await fs.access(sessionPath);
      await fs.copyFile(sessionPath, backupPath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.warn(`[SessionStorage] Failed to create backup for ${sessionId}:`, error);
      }
    }
  }
}

// Export singleton instance
export const sessionStorage = SessionStorageService.getInstance();
