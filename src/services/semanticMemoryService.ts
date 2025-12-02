import { MemoryEntry, RAGDocument } from '../types/index.js';

export interface SemanticMemoryEntry extends MemoryEntry {
  embedding?: number[];
  keywords: string[];
  importance: number;
  category: string;
  relatedMemories: string[];
  semanticScore?: number;
}

export interface MemoryCluster {
  id: string;
  name: string;
  description: string;
  memories: string[];
  centroid?: number[];
  coherence: number;
  size: number;
}

export interface SemanticSearchResult {
  memory: SemanticMemoryEntry;
  similarity: number;
  explanation: string;
}

export interface MemoryInsight {
  type: 'pattern' | 'contradiction' | 'evolution' | 'cluster' | 'trend';
  title: string;
  description: string;
  evidence: string[];
  confidence: number;
  relatedMemories: string[];
}

/**
 * Vector-Based Semantic Memory Service
 *
 * Enhances memory storage and retrieval with:
 * - Vector embeddings for semantic similarity
 * - Semantic clustering of related memories
 * - Pattern recognition across memory graph
 * - Improved retrieval with context awareness
 */
export class SemanticMemoryService {
  private semanticMemories: Map<string, SemanticMemoryEntry> = new Map();
  private memoryClusters: Map<string, MemoryCluster> = new Map();
  private embeddingCache: Map<string, number[]> = new Map();

  // Simple embedding simulation (in production, use actual embeddings like OpenAI text-embedding)
  private embeddingDimension = 384;

  /**
   * Store a memory with semantic analysis
   */
  async storeMemory(memory: MemoryEntry): Promise<string> {
    const semanticMemory = await this.analyzeMemorySemantics(memory);
    this.semanticMemories.set(semanticMemory.id, semanticMemory);

    // Update clustering
    this.updateMemoryClusters();

    return semanticMemory.id;
  }

  /**
   * Semantic search across all memories
   */
  async semanticSearch(
    query: string,
    limit: number = 10,
    threshold: number = 0.6
  ): Promise<SemanticSearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    const results: SemanticSearchResult[] = [];

    for (const memory of this.semanticMemories.values()) {
      const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding || []);
      const explanation = this.generateSimilarityExplanation(query, memory, similarity);

      if (similarity >= threshold) {
        results.push({
          memory,
          similarity,
          explanation
        });
      }
    }

    // Sort by similarity and return top results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Find related memories
   */
  async findRelatedMemories(memoryId: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    const memory = this.semanticMemories.get(memoryId);
    if (!memory) return [];

    const queryEmbedding = memory.embedding || [];
    const results: SemanticSearchResult[] = [];

    for (const [id, otherMemory] of this.semanticMemories.entries()) {
      if (id === memoryId) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, otherMemory.embedding || []);
      const explanation = `Related through shared concepts in ${otherMemory.category}`;

      results.push({
        memory: otherMemory,
        similarity,
        explanation
      });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Cluster memories by semantic similarity
   */
  getMemoryClusters(): MemoryCluster[] {
    return Array.from(this.memoryClusters.values()).sort((a, b) => b.coherence - a.coherence);
  }

  /**
   * Generate insights from memory patterns
   */
  generateMemoryInsights(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];

    // Pattern detection
    insights.push(...this.detectPatterns());

    // Contradiction detection
    insights.push(...this.detectContradictions());

    // Memory evolution analysis
    insights.push(...this.analyzeMemoryEvolution());

    // Cluster analysis
    insights.push(...this.analyzeClusters());

    return insights;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats(): {
    total: number;
    byCategory: Map<string, number>;
    averageImportance: number;
    clusters: number;
    recentActivity: number;
  } {
    const byCategory = new Map<string, number>();
    let totalImportance = 0;
    const now = Date.now();
    const recentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
    let recentActivity = 0;

    for (const memory of this.semanticMemories.values()) {
      byCategory.set(memory.category, (byCategory.get(memory.category) || 0) + 1);
      totalImportance += memory.importance;

      if (now - new Date(memory.date).getTime() < recentThreshold) {
        recentActivity++;
      }
    }

    return {
      total: this.semanticMemories.size,
      byCategory,
      averageImportance: this.semanticMemories.size > 0 ? totalImportance / this.semanticMemories.size : 0,
      clusters: this.memoryClusters.size,
      recentActivity
    };
  }

  /**
   * Analyze memory semantically
   */
  private async analyzeMemorySemantics(memory: MemoryEntry): Promise<SemanticMemoryEntry> {
    const embedding = await this.generateEmbedding(`${memory.topic} ${memory.content}`);
    const keywords = this.extractKeywords(memory.content);
    const importance = this.calculateImportance(memory);
    const category = this.categorizeMemory(memory);
    const relatedMemories = await this.findRelatedMemoryIds(embedding);

    return {
      ...memory,
      embedding,
      keywords,
      importance,
      category,
      relatedMemories
    };
  }

  /**
   * Generate embedding for text (simplified - uses keyword hashing)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const cacheKey = text.substring(0, 100); // Simple cache key
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    // Simple hash-based embedding simulation
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const embedding = new Array(this.embeddingDimension).fill(0);

    words.forEach(word => {
      const hash = this.simpleHash(word);
      const index = hash % this.embeddingDimension;
      embedding[index] += 1;
    });

    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }

    this.embeddingCache.set(cacheKey, embedding);
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were']);
    const words = text.toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 4 && !stopWords.has(w));

    // Count frequency
    const freq = new Map<string, number>();
    words.forEach(word => freq.set(word, (freq.get(word) || 0) + 1));

    // Return top keywords
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Calculate memory importance
   */
  private calculateImportance(memory: MemoryEntry): number {
    let score = 0.5; // Base score

    // Boost for longer content
    score += Math.min(memory.content.length / 1000, 0.2);

    // Boost for more tags
    score += (memory.tags.length / 10) * 0.2;

    // Boost for certain keywords
    const importantWords = ['decision', 'policy', 'strategy', 'important', 'critical', 'key', 'main'];
    const content = memory.content.toLowerCase();
    importantWords.forEach(word => {
      if (content.includes(word)) score += 0.05;
    });

    return Math.min(score, 1.0);
  }

  /**
   * Categorize memory
   */
  private categorizeMemory(memory: MemoryEntry): string {
    const text = `${memory.topic} ${memory.content}`.toLowerCase();

    const categories: Record<string, string[]> = {
      'decision': ['decision', 'vote', 'approve', 'reject', 'policy', 'resolution'],
      'discussion': ['debate', 'discuss', 'argue', 'agree', 'disagree', 'opinion'],
      'research': ['research', 'study', 'analysis', 'data', 'find', 'discover'],
      'prediction': ['predict', 'forecast', 'future', 'expect', 'likely', 'probability'],
      'technical': ['code', 'system', 'technical', 'implement', 'develop', 'build'],
      'legal': ['law', 'legal', 'regulation', 'compliance', 'rights', 'court']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Find related memory IDs
   */
  private async findRelatedMemoryIds(embedding: number[]): Promise<string[]> {
    const related: Array<{ id: string; similarity: number }> = [];

    for (const [id, memory] of this.semanticMemories.entries()) {
      const similarity = this.cosineSimilarity(embedding, memory.embedding || []);
      if (similarity > 0.7) {
        related.push({ id, similarity });
      }
    }

    return related.sort((a, b) => b.similarity - a.similarity).slice(0, 3).map(r => r.id);
  }

  /**
   * Update memory clusters
   */
  private updateMemoryClusters(): void {
    // Simple clustering based on category and similarity
    const memories = Array.from(this.semanticMemories.values());
    const clusters: Map<string, MemoryCluster> = new Map();

    // Group by category first
    const byCategory = new Map<string, SemanticMemoryEntry[]>();
    memories.forEach(memory => {
      const categoryMemories = byCategory.get(memory.category) || [];
      categoryMemories.push(memory);
      byCategory.set(memory.category, categoryMemories);
    });

    // Create clusters
    for (const [category, categoryMemories] of byCategory.entries()) {
      if (categoryMemories.length < 2) continue;

      const cluster: MemoryCluster = {
        id: `cluster-${category}`,
        name: `${category.charAt(0).toUpperCase() + category.slice(1)} Cluster`,
        description: `Memories related to ${category}`,
        memories: categoryMemories.map(m => m.id),
        coherence: this.calculateClusterCoherence(categoryMemories),
        size: categoryMemories.length
      };

      clusters.set(cluster.id, cluster);
    }

    this.memoryClusters = clusters;
  }

  /**
   * Calculate cluster coherence
   */
  private calculateClusterCoherence(memories: SemanticMemoryEntry[]): number {
    if (memories.length < 2) return 0;

    let totalSimilarity = 0;
    let count = 0;

    for (let i = 0; i < memories.length; i++) {
      for (let j = i + 1; j < memories.length; j++) {
        totalSimilarity += this.cosineSimilarity(
          memories[i].embedding || [],
          memories[j].embedding || []
        );
        count++;
      }
    }

    return count > 0 ? totalSimilarity / count : 0;
  }

  /**
   * Generate similarity explanation
   */
  private generateSimilarityExplanation(
    query: string,
    memory: SemanticMemoryEntry,
    similarity: number
  ): string {
    const commonKeywords = memory.keywords.filter(keyword =>
      query.toLowerCase().includes(keyword)
    );

    if (commonKeywords.length > 0) {
      return `Shares keywords: ${commonKeywords.slice(0, 3).join(', ')}`;
    }

    if (similarity > 0.8) {
      return 'Highly semantically related';
    } else if (similarity > 0.6) {
      return 'Semantically related';
    } else {
      return `Similarity: ${(similarity * 100).toFixed(0)}%`;
    }
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Detect patterns in memories
   */
  private detectPatterns(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];
    const patterns = new Map<string, string[]>();

    // Group memories by keywords
    for (const memory of this.semanticMemories.values()) {
      memory.keywords.forEach(keyword => {
        const memories = patterns.get(keyword) || [];
        memories.push(memory.id);
        patterns.set(keyword, memories);
      });
    }

    // Find frequent patterns
    for (const [keyword, memoryIds] of patterns.entries()) {
      if (memoryIds.length >= 3) {
        insights.push({
          type: 'pattern',
          title: `Frequent Pattern: "${keyword}"`,
          description: `This concept appears in ${memoryIds.length} memories, indicating a recurring theme.`,
          evidence: memoryIds.slice(0, 3),
          confidence: Math.min(memoryIds.length / 10, 1.0),
          relatedMemories: memoryIds
        });
      }
    }

    return insights;
  }

  /**
   * Detect contradictions
   */
  private detectContradictions(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];
    // Simplified contradiction detection
    // In production, this would use more sophisticated NLP

    return insights;
  }

  /**
   * Analyze memory evolution
   */
  private analyzeMemoryEvolution(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];

    // Group memories by month
    const byMonth = new Map<string, number>();
    for (const memory of this.semanticMemories.values()) {
      const month = memory.date.substring(0, 7); // YYYY-MM
      byMonth.set(month, (byMonth.get(month) || 0) + 1);
    }

    // Find trends
    const months = Array.from(byMonth.entries()).sort();
    if (months.length >= 2) {
      const recent = months[months.length - 1][1];
      const previous = months[months.length - 2][1];
      const change = (recent - previous) / previous;

      if (Math.abs(change) > 0.3) {
        insights.push({
          type: 'evolution',
          title: `Memory Activity Trend`,
          description: `Memory creation ${change > 0 ? 'increased' : 'decreased'} by ${(Math.abs(change) * 100).toFixed(0)}%`,
          evidence: months.slice(-2).map(([m, c]) => `${m}: ${c} memories`),
          confidence: 0.7,
          relatedMemories: []
        });
      }
    }

    return insights;
  }

  /**
   * Analyze clusters
   */
  private analyzeClusters(): MemoryInsight[] {
    const insights: MemoryInsight[] = [];

    for (const cluster of this.memoryClusters.values()) {
      if (cluster.size >= 3) {
        insights.push({
          type: 'cluster',
          title: `Knowledge Cluster: ${cluster.name}`,
          description: `Coherent cluster of ${cluster.size} related memories with ${(cluster.coherence * 100).toFixed(0)}% internal similarity.`,
          evidence: cluster.memories.slice(0, 3),
          confidence: cluster.coherence,
          relatedMemories: cluster.memories
        });
      }
    }

    return insights;
  }

  /**
   * Export semantic memories
   */
  exportSemanticMemories(): string {
    return JSON.stringify({
      memories: Array.from(this.semanticMemories.values()),
      clusters: Array.from(this.memoryClusters.values()),
      insights: this.generateMemoryInsights()
    }, null, 2);
  }
}

// Export singleton instance
export const semanticMemoryService = new SemanticMemoryService();
