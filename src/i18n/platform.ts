/**
 * Multi-Language Platform Features
 * Advanced i18n: translation memory, auto-detection, pluralization, gender
 */

import { Locale, Translations, i18n as I18nClass } from './index';

// ============================================
// Types
// ============================================

export interface TranslationMemoryEntry {
  key: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  source: string;
  target: string;
  context?: string;
  usageCount: number;
  lastUsed: number;
  verified: boolean;
}

export interface LocaleDetectionOptions {
  acceptLanguage?: string;
  queryParam?: string;
  cookie?: string;
  storageKey?: string;
}

export interface PluralRules {
  locale: Locale;
  cardinal: (n: number) => 'one' | 'other' | 'few' | 'many';
  ordinal: (n: number) => 'one' | 'two' | 'few' | 'many' | 'other';
}

export interface GenderedTranslation {
  male?: string;
  female?: string;
  neutral?: string;
}

export interface TranslationContext {
  count?: number;
  gender?: 'male' | 'female' | 'neutral';
  topic?: string;
}

// ============================================
// Translation Memory
// ============================================

export class TranslationMemory {
  private entries: Map<string, TranslationMemoryEntry> = new Map();
  private readonly MAX_ENTRIES = 10000;

  addEntry(
    key: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    source: string,
    target: string,
    context?: string
  ): void {
    const id = `${sourceLocale}:${targetLocale}:${key}`;
    
    const entry: TranslationMemoryEntry = {
      key,
      sourceLocale,
      targetLocale,
      source,
      target,
      context,
      usageCount: 1,
      lastUsed: Date.now(),
      verified: false
    };

    // Check if similar entry exists
    const existing = this.findSimilar(source, sourceLocale, targetLocale);
    if (existing) {
      existing.usageCount++;
      existing.lastUsed = Date.now();
    } else {
      this.entries.set(id, entry);
      this.pruneIfNeeded();
    }
  }

  findSimilar(text: string, sourceLocale: Locale, targetLocale: Locale): TranslationMemoryEntry | undefined {
    const normalized = text.toLowerCase().trim();
    
    for (const entry of this.entries.values()) {
      if (entry.sourceLocale === sourceLocale && entry.targetLocale === targetLocale) {
        const similarity = this.calculateSimilarity(normalized, entry.source.toLowerCase());
        if (similarity > 0.8) {
          return entry;
        }
      }
    }
    
    return undefined;
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    const matrix: number[][] = [];
    
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLen = Math.max(a.length, b.length);
    return 1 - matrix[a.length][b.length] / maxLen;
  }

  getEntry(key: string, sourceLocale: Locale, targetLocale: Locale): TranslationMemoryEntry | undefined {
    return this.entries.get(`${sourceLocale}:${targetLocale}:${key}`);
  }

  search(query: string, targetLocale: Locale): TranslationMemoryEntry[] {
    const normalized = query.toLowerCase();
    const results: TranslationMemoryEntry[] = [];
    
    for (const entry of this.entries.values()) {
      if (entry.targetLocale === targetLocale) {
        if (entry.target.toLowerCase().includes(normalized) || 
            entry.key.toLowerCase().includes(normalized)) {
          results.push(entry);
        }
      }
    }
    
    return results.sort((a, b) => b.usageCount - a.usageCount);
  }

  markVerified(key: string, sourceLocale: Locale, targetLocale: Locale): void {
    const entry = this.getEntry(key, sourceLocale, targetLocale);
    if (entry) {
      entry.verified = true;
    }
  }

  export(): TranslationMemoryEntry[] {
    return Array.from(this.entries.values());
  }

  import(entries: TranslationMemoryEntry[]): void {
    for (const entry of entries) {
      const id = `${entry.sourceLocale}:${entry.targetLocale}:${entry.key}`;
      this.entries.set(id, entry);
    }
    this.pruneIfNeeded();
  }

  private pruneIfNeeded(): void {
    if (this.entries.size > this.MAX_ENTRIES) {
      // Remove least recently used entries
      const sorted = Array.from(this.entries.values())
        .sort((a, b) => a.lastUsed - b.lastUsed);
      
      const toRemove = sorted.slice(0, this.entries.size - this.MAX_ENTRIES);
      for (const entry of toRemove) {
        const id = `${entry.sourceLocale}:${entry.targetLocale}:${entry.key}`;
(id);
      }
    }
  }
}

// ============================================        this.entries.delete
// Locale Detection
// ============================================

export class LocaleDetector {
  private options: LocaleDetectionOptions;
  private storage: Map<string, Locale> = new Map();

  constructor(options: LocaleDetectionOptions = {}) {
    this.options = options;
  }

  detect(
    request?: { headers?: Record<string, string>; url?: string },
    supportedLocales: Locale[] = []
  ): Locale {
    // 1. Check query parameter
    if (request?.url && this.options.queryParam) {
      const url = new URL(request.url, 'http://localhost');
      const queryLocale = url.searchParams.get(this.options.queryParam);
      if (queryLocale && this.isValidLocale(queryLocale, supportedLocales)) {
        return queryLocale;
      }
    }

    // 2. Check cookie
    if (this.options.cookie && request?.headers?.cookie) {
      const cookies = this.parseCookies(request.headers.cookie);
      const cookieLocale = cookies[this.options.cookie];
      if (cookieLocale && this.isValidLocale(cookieLocale, supportedLocales)) {
        return cookieLocale;
      }
    }

    // 3. Check Accept-Language header
    if (this.options.acceptLanguage && request?.headers?.[this.options.acceptLanguage]) {
      const acceptLanguage = request.headers[this.options.acceptLanguage];
      const detected = this.parseAcceptLanguage(acceptLanguage, supportedLocales);
      if (detected) {
        return detected;
      }
    }

    // 4. Check storage
    if (this.options.storageKey && typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored && this.isValidLocale(stored, supportedLocales)) {
        return stored;
      }
    }

    // 5. Fallback to navigator
    if (typeof navigator !== 'undefined') {
      const browserLocale = navigator.language || (navigator as any).userLanguage;
      if (this.isValidLocale(browserLocale, supportedLocales)) {
        return browserLocale;
      }
    }

    return 'en';
  }

  private parseAcceptLanguage(header: string, supported: Locale[]): Locale | null {
    const parts = header.split(',').map(p => {
      const [locale, quality] = p.trim().split(';');
      const q = quality ? parseFloat(quality.split('=')[1]) : 1;
      return { locale: locale.trim(), q };
    });

    parts.sort((a, b) => b.q - a.q);

    for (const part of parts) {
      if (this.isValidLocale(part.locale, supported)) {
        return part.locale;
      }
      
      // Try language code only
      const langCode = part.locale.split('-')[0];
      const match = supported.find(l => l.startsWith(langCode));
      if (match) {
        return match;
      }
    }

    return null;
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    for (const cookie of cookieHeader.split(';')) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    }
    return cookies;
  }

  private isValidLocale(locale: string, supported: Locale[]): boolean {
    if (!supported.length) return true;
    return supported.includes(locale as Locale) || 
           supported.some(l => l.startsWith(locale.split('-')[0]));
  }

  persist(locale: Locale): void {
    if (this.options.storageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.options.storageKey, locale);
    }
    this.storage.set('current', locale);
  }
}

// ============================================
// Advanced Translation with Plural/Gender
// ============================================

export class AdvancedI18n {
  private i18n: I18nClass;
  private pluralRules: PluralRules[] = [];
  private translationMemory: TranslationMemory;

  constructor(i18n: I18nClass) {
    this.i18n = i18n;
    this.translationMemory = new TranslationMemory();
    this.initPluralRules();
  }

  private initPluralRules(): void {
    // Common locales with their plural rules
    const locales = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'ar', 'hi'];
    
    for (const locale of locales as Locale[]) {
      try {
        const nf = new Intl.PluralRules(locale);
        this.pluralRules.push({
          locale,
          cardinal: (n) => nf.select(n) as 'one' | 'other' | 'few' | 'many',
          ordinal: (n) => {
            // Simplified ordinal
            const s = nf.select(n);
            return s === 'one' ? 'one' : 'other';
          }
        });
      } catch {
        // Fallback
        this.pluralRules.push({
          locale,
          cardinal: () => 'other',
          ordinal: () => 'other'
        });
      }
    }
  }

  /**
   * Translate with plural support
   */
  translatePlural(
    key: string,
    count: number,
    options?: {
      one?: string;
      other?: string;
      few?: string;
      many?: string;
    }
  ): string {
    const locale = this.i18n.getLocale();
    const rules = this.pluralRules.find(r => r.locale === locale) || 
                  this.pluralRules.find(r => r.locale === 'en')!;
    
    const form = rules.cardinal(count);
    
    // Try specific forms first
    if (form === 'one' && options?.one) {
      return this.i18n.t(key as any, { count });
    }
    if ((form === 'few' || form === 'many') && (options?.few || options?.many)) {
      return this.i18n.t(key as any, { count });
    }
    
    // Fallback to 'other'
    return this.i18n.t(key as any, { count: this.i18n.formatNumber(count) });
  }

  /**
   * Translate with gender support
   */
  translateGender(
    key: string,
    gender: 'male' | 'female' | 'neutral',
    translations: GenderedTranslation
  ): string {
    const value = translations[gender] || translations.neutral || key;
    
    // Check translation memory first
    const memEntry = this.translationMemory.getEntry(
      key,
      this.i18n.getLocale(),
      this.i18n.getLocale()
    );
    
    if (memEntry) {
      return memEntry.target;
    }
    
    return value;
  }

  /**
   * Translate with context
   */
  translateWithContext(
    key: string,
    context: TranslationContext
  ): string {
    let translation = this.i18n.t(key as any);
    
    if (context.count !== undefined) {
      translation = translation.replace('{count}', String(context.count));
    }
    
    return translation;
  }

  /**
   * Add to translation memory
   */
  learnTranslation(
    key: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    source: string,
    target: string,
    context?: string
  ): void {
    this.translationMemory.addEntry(key, sourceLocale, targetLocale, source, target, context);
  }

  /**
   * Get translation suggestions from memory
   */
  getSuggestions(text: string): TranslationMemoryEntry[] {
    return this.translationMemory.search(text, this.i18n.getLocale());
  }

  getTranslationMemory(): TranslationMemory {
    return this.translationMemory;
  }
}

// ============================================
// Language Detection from Content
// ============================================

export interface LanguageDetectionResult {
  locale: Locale;
  confidence: number;
  alternatives: Array<{ locale: Locale; confidence: number }>;
}

const LANGUAGE_PATTERNS: Record<Locale, RegExp[]> = {
  'zh-CN': [
    /[\u4e00-\u9fff]/,
    /[\u3400-\u4dbf]/
  ],
  'zh-TW': [
    /[\u4e00-\u9fff]/,
    /[\u3400-\u4dbf]/
  ],
  'ja': [
    /[\u3040-\u309f]/,
    /[\u30a0-\u30ff]/
  ],
  'ko': [
    /[\uac00-\ud7af]/,
    /[\u1100-\u11ff]/
  ],
  'ar': [
    /[\u0600-\u06ff]/,
    /[\u0750-\u077f]/
  ],
  'ru': [
    /[\u0400-\u04ff]/
  ],
  'hi': [
    /[\u0900-\u097f]/
  ],
  'en': [
    /\b(the|a|an|is|are|was|were|be|been|being)\b/i,
    /\b(and|or|but|if|then|else|when)\b/i
  ],
  'es': [
    /\b(el|la|los|las|un|una|unos|unas|es|son|está|están)\b/i
  ],
  'fr': [
    /\b(le|la|les|un|une|des|est|sont|être|avoir)\b/i
  ],
  'de': [
    /\b(der|die|das|ein|eine|ist|sind|sein|haben)\b/i
  ]
  // Add more locales as needed
};

export class ContentLanguageDetector {
  detect(text: string): LanguageDetectionResult {
    const scores: Record<Locale, number> = {} as Record<Locale, number>;
    
    for (const [locale, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      scores[locale] = 0;
      
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          scores[locale] += matches.length;
        }
      }
    }
    
    // Sort by score
    const sorted = Object.entries(scores)
      .sort((a, b) => b[1] - a[1]);
    
    const total = sorted.reduce((sum, [, score]) => sum + score, 1);
    
    const top = sorted[0];
    const confidence = total > 0 ? (top[1] / total) : 0;
    
    return {
      locale: top[0] as Locale,
      confidence,
      alternatives: sorted.slice(1, 5).map(([locale, score]) => ({
        locale: locale as Locale,
        confidence: total > 0 ? score / total : 0
      }))
    };
  }
}

// ============================================
// Export helper functions
// ============================================

export function createTranslationMemory(): TranslationMemory {
  return new TranslationMemory();
}

export function createLocaleDetector(options?: LocaleDetectionOptions): LocaleDetector {
  return new LocaleDetector(options);
}

export function createAdvancedI18n(i18n: I18nClass): AdvancedI18n {
  return new AdvancedI18n(i18n);
}

export function detectContentLanguage(text: string): LanguageDetectionResult {
  const detector = new ContentLanguageDetector();
  return detector.detect(text);
}
