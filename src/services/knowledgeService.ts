import { MemoryEntry, RAGDocument, BotMemory } from '../types/index.js';
import { semanticMemoryService } from './semanticMemoryService.js';

export interface CleanupConfig {
  maxMemories: number;
  maxDocuments: number;
  memoryRetentionDays: number;
  documentRetentionDays: number;
  autoCleanup: boolean;
  maxBotMemories?: number;
  botMemoryRetentionDays?: number;
}

// Simple in-memory storage (in production, use a proper database)
class KnowledgeStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private documents: Map<string, RAGDocument> = new Map();
  private botMemories: Map<string, BotMemory> = new Map();
  private cleanupConfig: CleanupConfig;

  constructor() {
    this.cleanupConfig = {
      maxMemories: 1000,
      maxDocuments: 500,
      memoryRetentionDays: 90,
      documentRetentionDays: 365,
      autoCleanup: true,
      maxBotMemories: 500,
      botMemoryRetentionDays: 30
    };
  }

  // Memory operations
  addMemory(memory: MemoryEntry): void {
    this.memories.set(memory.id, memory);
  }

  getMemory(id: string): MemoryEntry | undefined {
    return this.memories.get(id);
  }

  searchMemories(query: string, limit: number = 10): MemoryEntry[] {
    const results: Array<{ memory: MemoryEntry; score: number }> = [];
    const queryLower = query.toLowerCase();

    for (const memory of this.memories.values()) {
      const score = this.calculateRelevance(queryLower, memory.topic.toLowerCase(), memory.content.toLowerCase());
      if (score > 0) {
        results.push({ memory, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.memory);
  }

  listMemories(): MemoryEntry[] {
    return Array.from(this.memories.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  deleteMemory(id: string): boolean {
    return this.memories.delete(id);
  }

  // Document operations
  addDocument(document: RAGDocument): void {
    this.documents.set(document.id, document);
  }

  getDocument(id: string): RAGDocument | undefined {
    return this.documents.get(id);
  }

  searchDocuments(query: string, limit: number = 5): string[] {
    const results: Array<{ content: string; score: number }> = [];
    const queryLower = query.toLowerCase();

    for (const doc of this.documents.values()) {
      if (!doc.active) continue;

      const score = this.calculateRelevance(
        queryLower,
        doc.title.toLowerCase(),
        doc.content.toLowerCase()
      );

      if (score > 0) {
        // Extract relevant snippets
        const content = doc.content;
        const index = content.toLowerCase().indexOf(queryLower);
        let snippet = '';

        if (index !== -1) {
          const start = Math.max(0, index - 100);
          const end = Math.min(content.length, index + query.length + 100);
          snippet = '...' + content.slice(start, end) + '...';
        } else {
          snippet = content.slice(0, 200) + '...';
        }

        results.push({ content: snippet, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.content);
  }

  listDocuments(): RAGDocument[] {
    return Array.from(this.documents.values());
  }

  deleteDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  // Bot Memory operations
  addBotMemory(memory: BotMemory): void {
    this.botMemories.set(memory.id, memory);
  }

  getBotMemory(id: string): BotMemory | undefined {
    return this.botMemories.get(id);
  }

  getBotMemories(botId: string): BotMemory[] {
    return Array.from(this.botMemories.values()).filter(m => m.botId === botId);
  }

  searchBotContext(botId: string, query: string): string {
    const memories = this.getBotMemories(botId);
    if (memories.length === 0) return "";

    const q = query.toLowerCase();
    // Find memories that match the current topic/query
    // Or return all if they are marked as 'directives' (permanent instructions)
    const relevant = memories.filter(m => {
      if (m.type === 'directive') return true; // Always include directives
      return m.content.toLowerCase().includes(q) || q.includes(m.content.toLowerCase());
    });

    if (relevant.length === 0) return "";

    return `\n[PERSONAL MEMORY / CONTEXT]:\n${relevant.map(m => `- ${m.content}`).join('\n')}`;
  }

  deleteBotMemory(id: string): boolean {
    return this.botMemories.delete(id);
  }

  // Cleanup methods
  /**
   * Clean up old or excess memories
   * @returns Number of memories cleaned
   */
  cleanupMemories(): number {
    const now = Date.now();
    const retentionMs = this.cleanupConfig.memoryRetentionDays * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    // First, remove old memories
    for (const [id, memory] of this.memories.entries()) {
      const age = now - new Date(memory.date).getTime();
      if (age > retentionMs) {
        this.memories.delete(id);
        cleanedCount++;
      }
    }

    // Then, enforce max count by removing oldest
    if (this.memories.size > this.cleanupConfig.maxMemories) {
      const memories = Array.from(this.memories.entries())
        .sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime());

      const toDelete = memories.slice(0, this.memories.size - this.cleanupConfig.maxMemories);
      for (const [id] of toDelete) {
        this.memories.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clean up old or excess documents
   * @returns Number of documents cleaned
   */
  cleanupDocuments(): number {
    const now = Date.now();
    const retentionMs = this.cleanupConfig.documentRetentionDays * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    // First, remove old documents
    for (const [id, doc] of this.documents.entries()) {
      const age = now - (doc.createdAt || now);
      if (age > retentionMs) {
        this.documents.delete(id);
        cleanedCount++;
      }
    }

    // Then, enforce max count by removing oldest inactive first, then oldest active
    if (this.documents.size > this.cleanupConfig.maxDocuments) {
      const documents = Array.from(this.documents.entries())
        .sort((a, b) => {
          // Prioritize removing inactive documents
          if (a[1].active !== b[1].active) {
            return a[1].active ? 1 : -1;
          }
          // Then by creation date
          return (a[1].createdAt || 0) - (b[1].createdAt || 0);
        });

      const toDelete = documents.slice(0, this.documents.size - this.cleanupConfig.maxDocuments);
      for (const [id] of toDelete) {
        this.documents.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Clean up old or excess bot memories
   * @returns Number of bot memories cleaned
   */
  cleanupBotMemories(): number {
    const now = Date.now();
    const retentionMs = (this.cleanupConfig.botMemoryRetentionDays || 30) * 24 * 60 * 60 * 1000;
    let cleanedCount = 0;

    // First, remove old bot memories
    for (const [id, memory] of this.botMemories.entries()) {
      const age = now - memory.timestamp;
      if (age > retentionMs) {
        this.botMemories.delete(id);
        cleanedCount++;
      }
    }

    // Then, enforce max count by removing oldest
    const maxBotMemories = this.cleanupConfig.maxBotMemories || 500;
    if (this.botMemories.size > maxBotMemories) {
      const memories = Array.from(this.botMemories.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toDelete = memories.slice(0, this.botMemories.size - maxBotMemories);
      for (const [id] of toDelete) {
        this.botMemories.delete(id);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Run full cleanup on both memories, documents, and bot memories
   * @returns Summary of cleanup operation
   */
  fullCleanup(): { memoriesCleaned: number; documentsCleaned: number; botMemoriesCleaned: number; total: number } {
    const memoriesCleaned = this.cleanupMemories();
    const documentsCleaned = this.cleanupDocuments();
    const botMemoriesCleaned = this.cleanupBotMemories();

    return {
      memoriesCleaned,
      documentsCleaned,
      botMemoriesCleaned,
      total: memoriesCleaned + documentsCleaned + botMemoriesCleaned
    };
  }

  /**
   * Get cleanup statistics
   */
  getCleanupStats(): {
    memory: {
      current: number;
      max: number;
      retentionDays: number;
      willClean: number;
    };
    document: {
      current: number;
      max: number;
      retentionDays: number;
      willClean: number;
    };
  } {
    const now = Date.now();
    const memoryRetentionMs = this.cleanupConfig.memoryRetentionDays * 24 * 60 * 60 * 1000;
    const docRetentionMs = this.cleanupConfig.documentRetentionDays * 24 * 60 * 60 * 1000;

    // Count memories that would be cleaned
    let oldMemories = 0;
    for (const memory of this.memories.values()) {
      const age = now - new Date(memory.date).getTime();
      if (age > memoryRetentionMs) oldMemories++;
    }

    // Count excess memories
    const excessMemories = Math.max(0, this.memories.size - this.cleanupConfig.maxMemories);

    // Count documents that would be cleaned
    let oldDocuments = 0;
    for (const doc of this.documents.values()) {
      const age = now - (doc.createdAt || now);
      if (age > docRetentionMs) oldDocuments++;
    }

    // Count excess documents
    const excessDocuments = Math.max(0, this.documents.size - this.cleanupConfig.maxDocuments);

    return {
      memory: {
        current: this.memories.size,
        max: this.cleanupConfig.maxMemories,
        retentionDays: this.cleanupConfig.memoryRetentionDays,
        willClean: oldMemories + excessMemories
      },
      document: {
        current: this.documents.size,
        max: this.cleanupConfig.maxDocuments,
        retentionDays: this.cleanupConfig.documentRetentionDays,
        willClean: oldDocuments + excessDocuments
      }
    };
  }

  /**
   * Update cleanup configuration
   */
  updateCleanupConfig(config: Partial<CleanupConfig>): void {
    this.cleanupConfig = { ...this.cleanupConfig, ...config };
  }

  /**
   * Get current cleanup configuration
   */
  getCleanupConfig(): CleanupConfig {
    return { ...this.cleanupConfig };
  }

  private calculateRelevance(query: string, ...texts: string[]): number {
    let score = 0;
    const queryWords = query.split(/\s+/);

    for (const text of texts) {
      for (const word of queryWords) {
        if (word.length < 3) continue; // Skip short words

        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length * word.length;
        }
      }
    }

    return score;
  }
}

export const knowledgeStore = new KnowledgeStore();

export async function saveMemory(memory: MemoryEntry): Promise<void> {
  knowledgeStore.addMemory(memory);

  // Also store in semantic memory
  try {
    await semanticMemoryService.storeMemory(memory);
  } catch (error) {
    console.error('[SemanticMemory] Error storing memory:', error);
  }
}

export async function searchMemories(query: string, limit?: number): Promise<MemoryEntry[]> {
  return knowledgeStore.searchMemories(query, limit);
}

export async function semanticSearchMemories(query: string, limit?: number, threshold?: number): Promise<any[]> {
  try {
    const results = await semanticMemoryService.semanticSearch(query, limit, threshold);
    return results.map(result => ({
      memory: result.memory,
      similarity: result.similarity,
      explanation: result.explanation
    }));
  } catch (error) {
    console.error('[SemanticMemory] Error in semantic search:', error);
    return knowledgeStore.searchMemories(query, limit);
  }
}

export async function getRelatedMemories(memoryId: string, limit?: number): Promise<any[]> {
  try {
    const results = await semanticMemoryService.findRelatedMemories(memoryId, limit);
    return results.map(result => ({
      memory: result.memory,
      similarity: result.similarity,
      explanation: result.explanation
    }));
  } catch (error) {
    console.error('[SemanticMemory] Error finding related memories:', error);
    return [];
  }
}

export function getMemoryClusters(): any[] {
  try {
    return semanticMemoryService.getMemoryClusters();
  } catch (error) {
    console.error('[SemanticMemory] Error getting clusters:', error);
    return [];
  }
}

export function generateMemoryInsights(): any[] {
  try {
    return semanticMemoryService.generateMemoryInsights();
  } catch (error) {
    console.error('[SemanticMemory] Error generating insights:', error);
    return [];
  }
}

export function getMemoryStatistics(): any {
  try {
    return semanticMemoryService.getMemoryStats();
  } catch (error) {
    console.error('[SemanticMemory] Error getting stats:', error);
    return {
      total: knowledgeStore.listMemories().length,
      byCategory: new Map(),
      averageImportance: 0,
      clusters: 0,
      recentActivity: 0
    };
  }
}

export async function listMemories(): Promise<MemoryEntry[]> {
  return knowledgeStore.listMemories();
}

export async function deleteMemory(id: string): Promise<boolean> {
  return knowledgeStore.deleteMemory(id);
}

export async function saveDocument(document: RAGDocument): Promise<void> {
  knowledgeStore.addDocument(document);
}

export async function searchDocuments(documents: RAGDocument[], query: string): Promise<string[]> {
  // Add all documents to the store first
  for (const doc of documents) {
    if (doc.active) {
      knowledgeStore.addDocument(doc);
    }
  }
  return knowledgeStore.searchDocuments(query);
}

export async function listDocuments(): Promise<RAGDocument[]> {
  return knowledgeStore.listDocuments();
}

export async function deleteDocument(id: string): Promise<boolean> {
  return knowledgeStore.deleteDocument(id);
}

// Bot Memory functions
export async function saveBotMemory(memory: BotMemory): Promise<void> {
  knowledgeStore.addBotMemory(memory);
}

export async function getBotMemory(id: string): Promise<BotMemory | undefined> {
  return knowledgeStore.getBotMemory(id);
}

export async function getBotMemories(botId: string): Promise<BotMemory[]> {
  return knowledgeStore.getBotMemories(botId);
}

export function searchBotContext(botId: string, query: string): string {
  return knowledgeStore.searchBotContext(botId, query);
}

export async function deleteBotMemory(id: string): Promise<boolean> {
  return knowledgeStore.deleteBotMemory(id);
}

// Cleanup functions
export async function cleanupMemories(): Promise<number> {
  return knowledgeStore.cleanupMemories();
}

export async function cleanupDocuments(): Promise<number> {
  return knowledgeStore.cleanupDocuments();
}

export async function fullCleanup(): Promise<{ memoriesCleaned: number; documentsCleaned: number; botMemoriesCleaned: number; total: number }> {
  return knowledgeStore.fullCleanup();
}

export function getCleanupStats(): ReturnType<KnowledgeStore['getCleanupStats']> {
  return knowledgeStore.getCleanupStats();
}

export function updateCleanupConfig(config: Partial<CleanupConfig>): void {
  knowledgeStore.updateCleanupConfig(config);
}

export function getCleanupConfig(): CleanupConfig {
  return knowledgeStore.getCleanupConfig();
}
