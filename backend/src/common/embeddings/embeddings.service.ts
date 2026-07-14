import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Type for embedding vectors
// Using a simple array type for now; in production you might use a more specific type
// based on your embedding model's output dimension
interface EmbeddingVector {
  vector: number[];
  dimension: number;
}

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private isLocalModelLoaded = false;
  private embeddingModel: any = null;
  private readonly defaultDimension = 384; // all-MiniLM-L6-v2 dimension

  // Cache for embeddings to avoid recomputation
  private embeddingCache: Map<string, number[]> = new Map();
  private cacheMaxSize = 1000;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // Try to load local embedding model
    await this.loadLocalModel();
  }

  /**
   * Loads the local embedding model (all-MiniLM-L6-v2)
   */
  private async loadLocalModel(): Promise<void> {
    try {
      const useLocalModel = this.configService.get<string>('USE_LOCAL_EMBEDDINGS', 'true') === 'true';
      
      if (useLocalModel) {
        // Dynamic import to avoid loading heavy dependencies at startup
        const { pipeline } = await import('@xenova/transformers');
        
        this.logger.log('Loading local embedding model (all-MiniLM-L6-v2)...');
        
        // Load the model
        const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        
        this.embeddingModel = extractor;
        this.isLocalModelLoaded = true;
        
        this.logger.log('Local embedding model loaded successfully');
      } else {
        this.logger.log('Local embedding model disabled. Using fallback.');
      }
    } catch (error) {
      this.logger.warn(`Failed to load local embedding model: ${error.message}`);
      this.isLocalModelLoaded = false;
    }
  }

  /**
   * Generates an embedding vector for the given text
   * @param text The text to embed
   * @returns Embedding vector as array of numbers
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    if (this.embeddingCache.has(text)) {
      return this.embeddingCache.get(text)!;
    }

    try {
      if (this.isLocalModelLoaded && this.embeddingModel) {
        // Use local model
        const output = await this.embeddingModel(text, { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data) as number[];
        
        // Cache the result
        this.cacheEmbedding(text, embedding);
        
        return embedding;
      } else {
        // Fallback: use a mock embedding (in production, you might call an external API)
        this.logger.warn('Using fallback embedding - local model not available');
        return this.generateFallbackEmbedding(text);
      }
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      return this.generateFallbackEmbedding(text);
    }
  }

  /**
   * Generates a fallback embedding when the local model is not available
   * This uses a simple hash-based approach for demonstration
   */
  private generateFallbackEmbedding(text: string): number[] {
    // Simple hash-based embedding for fallback
    // In production, you would call an external API or use a simpler model
    const hash = this.simpleHash(text);
    
    // Create a deterministic embedding based on hash
    const embedding: number[] = [];
    for (let i = 0; i < this.defaultDimension; i++) {
      // Use hash to generate pseudo-random but deterministic values
      const seed = hash + i;
      embedding.push(this.pseudoRandom(seed) * 2 - 1); // Values between -1 and 1
    }
    
    // Normalize
    return this.normalizeVector(embedding);
  }

  /**
   * Simple hash function for fallback embeddings
   */
  private simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Pseudo-random number generator with seed
   */
  private pseudoRandom(seed: number): number {
    // Simple linear congruential generator
    seed = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
    return seed / 0xFFFFFFFF;
  }

  /**
   * Normalizes a vector to unit length
   */
  private normalizeVector(vector: number[]): number[] {
    const length = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (length === 0) return vector;
    return vector.map((val) => val / length);
  }

  /**
   * Caches an embedding
   */
  private cacheEmbedding(text: string, embedding: number[]): void {
    // Evict oldest entries if cache is full
    if (this.embeddingCache.size >= this.cacheMaxSize) {
      const firstKey = this.embeddingCache.keys().next().value;
      if (firstKey) {
        this.embeddingCache.delete(firstKey);
      }
    }
    
    this.embeddingCache.set(text, embedding);
  }

  /**
   * Calculates cosine similarity between two vectors
   * @param a First vector
   * @param b Second vector
   * @returns Cosine similarity (0 to 1)
   */
  cosineSimilarity(a: number[], b: number[]): number {
    // Ensure vectors are the same length
    if (a.length !== b.length) {
      throw new Error(`Vectors must be the same length: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) return 0;
    
    return dotProduct / magnitude;
  }

  /**
   * Calculates cosine similarity between a text and an embedding
   * @param text The text to compare
   * @param embedding The embedding to compare against
   * @returns Cosine similarity
   */
  async cosineSimilarityWithText(text: string, embedding: number[]): Promise<number> {
    const textEmbedding = await this.generateEmbedding(text);
    return this.cosineSimilarity(textEmbedding, embedding);
  }

  /**
   * Finds the most similar embedding from a list
   * @param queryText The text to find similar embeddings for
   * @param candidates List of candidate embeddings with their associated data
   * @param threshold Minimum similarity threshold
   * @returns Best match or null if no match above threshold
   */
  async findMostSimilar(
    queryText: string,
    candidates: Array<{ embedding: number[]; data: any }>,
    threshold: number = 0.85,
  ): Promise<{ similarity: number; data: any } | null> {
    const queryEmbedding = await this.generateEmbedding(queryText);
    
    let bestMatch: { similarity: number; data: any } | null = null;
    let bestSimilarity = -1;

    for (const candidate of candidates) {
      const similarity = this.cosineSimilarity(queryEmbedding, candidate.embedding);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = { similarity, data: candidate.data };
      }
    }

    if (bestMatch && bestMatch.similarity >= threshold) {
      return bestMatch;
    }
    
    return null;
  }

  /**
   * Batch generates embeddings for multiple texts
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      results.push(embedding);
    }
    
    return results;
  }

  /**
   * Gets the dimension of the embedding vectors
   */
  getEmbeddingDimension(): number {
    return this.defaultDimension;
  }

  /**
   * Checks if the local model is loaded and available
   */
  isLocalModelAvailable(): boolean {
    return this.isLocalModelLoaded;
  }

  /**
   * Clears the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Gets the current cache size
   */
  getCacheSize(): number {
    return this.embeddingCache.size;
  }
}
