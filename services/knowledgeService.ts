
import { MemoryEntry, RAGDocument } from '../types';

const MEMORY_KEY = 'ai_council_memories';
const DOCUMENTS_KEY = 'ai_council_documents';

// --- LONG TERM MEMORY (PRECEDENTS) ---

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

// --- RAG DOCUMENTS (KNOWLEDGE BASE) ---

// In a real app, this would use embeddings. Here we use basic sliding window text matching.
export const searchDocuments = (documents: RAGDocument[], query: string): string[] => {
    const activeDocs = documents.filter(d => d.active);
    const results: string[] = [];
    const qParts = query.toLowerCase().split(' ').filter(w => w.length > 3);

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
