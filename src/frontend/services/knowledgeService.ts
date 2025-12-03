
import { MemoryEntry, RAGDocument, BotMemory } from '../types';

const MEMORY_KEY = 'ai_council_memories';
const BOT_MEMORY_KEY = 'ai_council_bot_memories';
const DOCUMENTS_KEY = 'ai_council_documents'; // Kept for reference, though usually in settings

// --- LONG TERM MEMORY (PRECEDENTS - GLOBAL) ---

export const getMemories = (): MemoryEntry[] => {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveMemory = (entry: MemoryEntry) => {
    const memories = getMemories();
    memories.push(entry);
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
};

export const searchMemories = (query: string): MemoryEntry[] => {
    const memories = getMemories();
    const q = query.toLowerCase();
    // Simple keyword matching
    return memories.filter(m => 
        m.topic.toLowerCase().includes(q) || 
        m.tags.some(t => t.toLowerCase().includes(q)) ||
        m.content.toLowerCase().includes(q)
    );
};

// --- AGENT SPECIFIC MEMORY ---

export const getAllBotMemories = (): BotMemory[] => {
    const stored = localStorage.getItem(BOT_MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const getBotMemories = (botId: string): BotMemory[] => {
    const all = getAllBotMemories();
    return all.filter(m => m.botId === botId);
};

export const addBotMemory = (botId: string, content: string, type: 'fact' | 'directive' | 'observation' = 'fact') => {
    const all = getAllBotMemories();
    const newMemory: BotMemory = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        botId,
        content,
        type,
        timestamp: Date.now()
    };
    all.push(newMemory);
    localStorage.setItem(BOT_MEMORY_KEY, JSON.stringify(all));
    return newMemory;
};

export const deleteBotMemory = (id: string) => {
    const all = getAllBotMemories();
    const filtered = all.filter(m => m.id !== id);
    localStorage.setItem(BOT_MEMORY_KEY, JSON.stringify(filtered));
};

export const searchBotContext = (botId: string, query: string): string => {
    const memories = getBotMemories(botId);
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
};


// --- RAG DOCUMENTS (KNOWLEDGE BASE) ---

// In a real app, this would use embeddings. Here we use basic sliding window text matching.
export const searchDocuments = (documents: RAGDocument[], query: string): string[] => {
    const activeDocs = documents.filter(d => d.active);
    const results: string[] = [];
    const qParts = query.toLowerCase().split(' ').filter(w => w.length > 3);
    
    if (qParts.length === 0) return [];

    activeDocs.forEach(doc => {
        // Very basic relevancy check
        const contentLower = doc.content.toLowerCase();
        let score = 0;
        
        qParts.forEach(term => {
            if (contentLower.includes(term)) score++;
        });

        // If relevant enough, return a snippet
        if (score > 0) {
            // Find best snippet (naive)
            const idx = contentLower.indexOf(qParts[0]);
            const start = Math.max(0, idx - 100);
            const end = Math.min(doc.content.length, idx + 500);
            results.push(`[Source: ${doc.title}]: ...${doc.content.substring(start, end)}...`);
        }
    });

    return results.slice(0, 3); // Top 3 snippets
};
