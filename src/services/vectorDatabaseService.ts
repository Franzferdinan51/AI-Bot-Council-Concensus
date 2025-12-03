import { createHash } from 'crypto';

export interface VectorEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    sessionId?: string;
    messageId?: string;
    author?: string;
    timestamp: number;
    type: 'message' | 'memory' | 'document' | 'summary';
    [key: string]: any;
  };
}

export interface SearchResult {
  entry: VectorEntry;
  similarity: number;
}

export interface ClusterResult {
  clusterId: string;
  entries: VectorEntry[];
  centroid: number[];
  topics: string[];
}

export class VectorDatabaseService {
  private vectors: Map<string, VectorEntry> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  constructor() { }

  async initialize(): Promise<void> {
    console.error('[VectorDB] Initialized (in-memory mode)');
  }

  async addVector(entry: Omit<VectorEntry, 'id'>): Promise<string> {
    const id = this.generateId();
    const vectorEntry: VectorEntry = {
      ...entry,
      id
    };

    this.vectors.set(id, vectorEntry);
    this.embeddings.set(id, entry.embedding);

    return id;
  }

  async addVectors(entries: Omit<VectorEntry, 'id'>[]): Promise<string[]> {
    return Promise.all(entries.map(entry => this.addVector(entry)));
  }

  async getVector(id: string): Promise<VectorEntry | null> {
    return this.vectors.get(id) || null;
  }

  async deleteVector(id: string): Promise<boolean> {
    const deleted = this.vectors.delete(id);
    this.embeddings.delete(id);
    return deleted;
  }

  async search(
    queryEmbedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
    filter?: (entry: VectorEntry) => boolean
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const [id, embedding] of this.embeddings.entries()) {
      const entry = this.vectors.get(id);
      if (!entry) continue;

      // Apply filter if provided
      if (filter && !filter(entry)) continue;

      const similarity = this.cosineSimilarity(queryEmbedding, embedding);

      if (similarity >= threshold) {
        results.push({
          entry,
          similarity
        });
      }
    }

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, limit);
  }

  async cluster(
    numClusters: number = 5,
    maxIterations: number = 100
  ): Promise<ClusterResult[]> {
    const vectors = Array.from(this.embeddings.values());
    const ids = Array.from(this.embeddings.keys());

    if (vectors.length === 0) return [];

    // Initialize centroids randomly
    const centroids: number[][] = [];
    for (let i = 0; i < numClusters; i++) {
      centroids.push([...vectors[Math.floor(Math.random() * vectors.length)]]);
    }

    const assignments: number[] = new Array(vectors.length).fill(0);

    // K-means clustering
    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      let changed = false;
      for (let i = 0; i < vectors.length; i++) {
        let minDistance = Infinity;
        let closestCentroid = 0;

        for (let j = 0; j < numClusters; j++) {
          const distance = this.euclideanDistance(vectors[i], centroids[j]);
          if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = j;
          }
        }

        if (assignments[i] !== closestCentroid) {
          assignments[i] = closestCentroid;
          changed = true;
        }
      }

      // Update centroids
      const sums: number[][] = Array.from({ length: numClusters }, () =>
        new Array(vectors[0].length).fill(0)
      );
      const counts: number[] = new Array(numClusters).fill(0);

      for (let i = 0; i < vectors.length; i++) {
        const cluster = assignments[i];
        for (let j = 0; j < vectors[i].length; j++) {
          sums[cluster][j] += vectors[i][j];
        }
        counts[cluster]++;
      }

      for (let j = 0; j < numClusters; j++) {
        if (counts[j] > 0) {
          centroids[j] = centroids[j].map((_, k) => sums[j][k] / counts[j]);
        }
      }

      if (!changed) break;
    }

    // Build results
    const clusters: Map<number, VectorEntry[]> = new Map();
    for (let i = 0; i < numClusters; i++) {
      clusters.set(i, []);
    }

    for (let i = 0; i < vectors.length; i++) {
      const entry = this.vectors.get(ids[i]);
      if (entry) {
        clusters.get(assignments[i])!.push(entry);
      }
    }

    const results: ClusterResult[] = [];
    clusters.forEach((entries, clusterId) => {
      if (entries.length > 0) {
        results.push({
          clusterId: `cluster_${clusterId}`,
          entries,
          centroid: centroids[clusterId],
          topics: this.extractTopics(entries)
        });
      }
    });

    return results;
  }

  async findSimilar(
    entryId: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    const embedding = this.embeddings.get(entryId);
    if (!embedding) return [];

    const queryEmbedding = [...embedding];
    return this.search(queryEmbedding, limit, 0.5, (entry) => entry.id !== entryId);
  }

  async getStats(): Promise<{
    totalVectors: number;
    averageSimilarity: number;
    clusters: number;
  }> {
    let totalSimilarity = 0;
    let comparisons = 0;
    const embeddings = Array.from(this.embeddings.values());

    // Calculate average similarity
    for (let i = 0; i < Math.min(embeddings.length, 100); i++) {
      for (let j = i + 1; j < Math.min(embeddings.length, 100); j++) {
        totalSimilarity += this.cosineSimilarity(embeddings[i], embeddings[j]);
        comparisons++;
      }
    }

    const clusters = await this.cluster();

    return {
      totalVectors: this.vectors.size,
      averageSimilarity: comparisons > 0 ? totalSimilarity / comparisons : 0,
      clusters: clusters.length
    };
  }

  async exportData(): Promise<any> {
    return {
      vectors: Array.from(this.vectors.values()),
      stats: await this.getStats(),
      exportedAt: new Date().toISOString()
    };
  }

  async importData(data: any): Promise<void> {
    if (data.vectors) {
      for (const vector of data.vectors) {
        await this.addVector(vector);
      }
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

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

  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  private extractTopics(entries: VectorEntry[]): string[] {
    // Simple topic extraction based on common words
    const wordFreq: Map<string, number> = new Map();

    entries.forEach(entry => {
      const words = entry.content.toLowerCase().split(/\W+/);
      words.forEach(word => {
        if (word.length > 4) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      });
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private generateId(): string {
    return `vec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const vectorDatabaseService = new VectorDatabaseService();
