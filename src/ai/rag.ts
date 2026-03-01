/**
 * AI Document Understanding Module
 * 
 * Provides RAG-based document question answering using LLM.
 */

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    page?: number;
    section?: string;
    heading?: string;
  };
  embedding?: number[];
}

export interface DocumentIndex {
  id: string;
  chunks: DocumentChunk[];
  metadata: {
    title: string;
    source: string;
    createdAt: number;
  };
}

export interface QueryResult {
  chunk: DocumentChunk;
  score: number;
}

export interface QAResult {
  question: string;
  answer: string;
  sources: ArrayOf<{ content: string; metadata: Record<string, unknown> }>;
  confidence: number;
}

type ArrayOf<T> = T[];

export interface RAGConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  model?: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  maxSources?: number;
}

class EmbeddingGenerator {
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
  }

  async generate(text: string): Promise<number[]> {
    const { provider, apiKey, embeddingModel } = this.config;
    
    // Use OpenAI embeddings by default
    const model = embeddingModel || 'text-embedding-ada-002';
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    const { provider, apiKey, embeddingModel } = this.config;
    
    const model = embeddingModel || 'text-embedding-ada-002';
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }
}

class TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;

  constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  split(text: string, metadata: Record<string, unknown> = {}): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > this.chunkSize && currentChunk.length > 0) {
        chunks.push({
          id: `chunk_${chunkIndex++}`,
          content: currentChunk.trim(),
          metadata: { ...metadata }
        });
        
        // Keep overlap
        const overlapStart = Math.max(0, currentChunk.length - this.chunkOverlap);
        currentChunk = currentChunk.slice(overlapStart) + '\n\n' + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: { ...metadata }
      });
    }
    
    return chunks;
  }
}

class VectorStore {
  private documents: Map<string, DocumentIndex> = new Map();

  async addDocument(doc: DocumentIndex): Promise<void> {
    this.documents.set(doc.id, doc);
  }

  async search(queryEmbedding: number[], topK: number = 5): Promise<QueryResult[]> {
    const results: QueryResult[] = [];
    
    for (const doc of this.documents.values()) {
      for (const chunk of doc.chunks) {
        if (!chunk.embedding) continue;
        
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding);
        results.push({ chunk, score });
      }
    }
    
    // Sort by score and return top K
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async deleteDocument(docId: string): Promise<void> {
    this.documents.delete(docId);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  getDocumentCount(): number {
    return this.documents.size;
  }
}

class LLMAnswerGenerator {
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
  }

  async generate(question: string, sources: DocumentChunk[]): Promise<QAResult> {
    const context = sources.map(s => s.content).join('\n\n---\n\n');
    
    const prompt = `You are a helpful assistant that answers questions based on the provided document context.

Context:
${context}

Question: ${question}

Instructions:
1. Answer the question based ONLY on the provided context
2. If the answer is not in the context, say "I don't have enough information to answer this question"
3. Cite your sources by referencing the relevant section
4. Be concise and accurate

Answer:`;

    const { provider, apiKey, model } = this.config;
    
    let response: Response;
    
    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model || 'claude-3-opus-20240229',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      });
    } else {
      throw new Error('Unsupported provider');
    }

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const answer = provider === 'openai' 
      ? data.choices[0].message.content 
      : data.content[0].text;

    return {
      question,
      answer,
      sources: sources.map(s => ({
        content: s.content,
        metadata: s.metadata
      })),
      confidence: this.calculateConfidence(answer, sources)
    };
  }

  private calculateConfidence(answer: string, sources: DocumentChunk[]): number {
    // Simple confidence based on source relevance
    if (sources.length === 0) return 0;
    const avgScore = sources.reduce((sum, s) => sum + (s.embedding ? 1 : 0), 0) / sources.length;
    return Math.min(0.95, avgScore + 0.3);
  }
}

export class RAGEngine {
  private config: RAGConfig;
  private embeddingGenerator: EmbeddingGenerator;
  private textSplitter: TextSplitter;
  private vectorStore: VectorStore;
  private answerGenerator: LLMAnswerGenerator;

  constructor(config: RAGConfig) {
    this.config = config;
    this.embeddingGenerator = new EmbeddingGenerator(config);
    this.textSplitter = new TextSplitter(config.chunkSize, config.chunkOverlap);
    this.vectorStore = new VectorStore();
    this.answerGenerator = new LLMAnswerGenerator(config);
  }

  async indexDocument(id: string, content: string, metadata: {
    title: string;
    source: string;
  }): Promise<DocumentIndex> {
    // Split into chunks
    const chunks = this.textSplitter.split(content, { source: metadata.source });
    
    // Generate embeddings
    const texts = chunks.map(c => c.content);
    const embeddings = await this.embeddingGenerator.generateBatch(texts);
    
    // Assign embeddings to chunks
    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });
    
    const doc: DocumentIndex = {
      id,
      chunks,
      metadata: {
        ...metadata,
        createdAt: Date.now()
      }
    };
    
    // Add to vector store
    await this.vectorStore.addDocument(doc);
    
    return doc;
  }

  async query(question: string): Promise<QAResult> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingGenerator.generate(question);
    
    // Search for relevant chunks
    const results = await this.vectorStore.search(queryEmbedding, this.config.maxSources || 5);
    
    if (results.length === 0) {
      return {
        question,
        answer: 'No relevant documents found.',
        sources: [],
        confidence: 0
      };
    }
    
    // Generate answer
    const answer = await this.answerGenerator.generate(
      question,
      results.map(r => r.chunk)
    );
    
    return answer;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.vectorStore.deleteDocument(id);
  }

  getDocumentCount(): number {
    return this.vectorStore.getDocumentCount();
  }
}

export function createRAGEngine(config: RAGConfig): RAGEngine {
  return new RAGEngine(config);
}

export { RAGEngine as default };
