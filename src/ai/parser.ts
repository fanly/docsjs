/**
 * AI-Powered Document Parsing
 * 
 * Provides AI-enhanced parsing for contracts and resumes using LLM.
 */

export interface ContractParsingOptions {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  model?: string;
  extractClauses?: boolean;
  extractDates?: boolean;
  extractParties?: boolean;
  extractAmounts?: boolean;
}

export interface ContractParsingResult {
  success: boolean;
  documentType: 'contract' | 'agreement' | 'nda' | 'other';
  parties: Array<{ name: string; role: string; address?: string }>;
  effectiveDate?: string;
  expirationDate?: string;
  amounts: ArrayOf<{ amount: string; currency: string; description: string }>;
  clauses: ArrayOf<{ title: string; content: string; importance: 'high' | 'medium' | 'low' }>;
  risks: string[];
  summary: string;
}

export interface ResumeParsingOptions {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  model?: string;
  extractSkills?: boolean;
  extractExperience?: boolean;
  extractEducation?: boolean;
}

export interface ResumeParsingResult {
  success: boolean;
  candidateName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  education: ArrayOf<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications?: string[];
  languages?: string[];
}

type ArrayOf<T> = T[];

export interface AIProviderConfig {
  type: 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

class BaseAIParser {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  protected async callAPI(prompt: string): Promise<string> {
    const { type, apiKey, baseUrl, model, maxTokens, temperature } = this.config;
    
    const body = {
      model: model || (type === 'openai' ? 'gpt-4' : 'claude-3-opus-20240229'),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens || 2000,
      temperature: temperature || 0.3
    };

    const url = baseUrl || (type === 'openai' 
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://api.anthropic.com/v1/messages');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (type === 'openai') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (type === 'openai') {
      return data.choices?.[0]?.message?.content || '';
    } else {
      return data.content?.[0]?.text || '';
    }
  }
}

export class ContractParser extends BaseAIParser {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  async parse(content: string, options?: Partial<ContractParsingOptions>): Promise<ContractParsingResult> {
    const prompt = this.buildPrompt(content, options);
    
    try {
      const response = await this.callAPI(prompt);
      const result = this.parseResponse(response);
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        documentType: 'other',
        parties: [],
        amounts: [],
        clauses: [],
        risks: [],
        summary: error instanceof Error ? error.message : 'Parsing failed'
      };
    }
  }

  private buildPrompt(content: string, options?: Partial<ContractParsingOptions>): string {
    return `Analyze the following legal document and extract structured information:

${content}

Extract the following information:
1. Document type (contract, agreement, nda, or other)
2. Parties involved (name, role, address)
3. Effective date
4. Expiration date
5. Financial amounts mentioned
6. Key clauses with their importance (high/medium/low)
7. Potential risks
8. A brief summary

Return the result as JSON with these fields:
{
  "documentType": "...",
  "parties": [{ "name": "...", "role": "...", "address": "..." }],
  "effectiveDate": "...",
  "expirationDate": "...",
  "amounts": [{ "amount": "...", "currency": "...", "description": "..." }],
  "clauses": [{ "title": "...", "content": "...", "importance": "high|medium|low" }],
  "risks": ["..."],
  "summary": "..."
}`;
  }

  private parseResponse(response: string): Partial<ContractParsingResult> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback to default
    }
    return { documentType: 'other', parties: [], amounts: [], clauses: [], risks: [], summary: response };
  }
}

export class ResumeParser extends BaseAIParser {
  constructor(config: AIProviderConfig) {
    super(config);
  }

  async parse(content: string, options?: Partial<ResumeParsingOptions>): Promise<ResumeParsingResult> {
    const prompt = this.buildPrompt(content, options);
    
    try {
      const response = await this.callAPI(prompt);
      const result = this.parseResponse(response);
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        skills: [],
        experience: [],
        education: []
      };
    }
  }

  private buildPrompt(content: string, options?: Partial<ResumeParsingOptions>): string {
    return `Analyze the following resume/CV and extract structured information:

${content}

Extract the following information:
1. Candidate name
2. Contact info (email, phone, location)
3. Professional summary
4. Skills (technical and soft)
5. Work experience (title, company, dates, description)
6. Education (degree, institution, year)
7. Certifications
8. Languages spoken

Return the result as JSON with these fields:
{
  "candidateName": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "summary": "...",
  "skills": ["..."],
  "experience": [{ "title": "...", "company": "...", "startDate": "...", "endDate": "...", "description": "..." }],
  "education": [{ "degree": "...", "institution": "...", "year": "..." }],
  "certifications": ["..."],
  "languages": ["..."]
}`;
  }

  private parseResponse(response: string): Partial<ResumeParsingResult> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    return { skills: [], experience: [], education: [] };
  }
}

export function createContractParser(config: AIProviderConfig): ContractParser {
  return new ContractParser(config);
}

export function createResumeParser(config: AIProviderConfig): ResumeParser {
  return new ResumeParser(config);
}
