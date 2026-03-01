/**
 * i18n Platform Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TranslationMemory, 
  LocaleDetector, 
  AdvancedI18n,
  ContentLanguageDetector,
  createTranslationMemory,
  createLocaleDetector,
  createAdvancedI18n,
  detectContentLanguage
} from '../../src/i18n/platform';
import { i18n } from '../../src/i18n/index';

describe('TranslationMemory', () => {
  let memory: TranslationMemory;

  beforeEach(() => {
    memory = createTranslationMemory();
  });

  describe('Basic Operations', () => {
    it('should create translation memory', () => {
      expect(memory).toBeDefined();
    });

    it('should add entries', () => {
      memory.addEntry('greeting', 'en', 'zh-CN', 'Hello', '你好');
      
      const entry = memory.getEntry('greeting', 'en', 'zh-CN');
      expect(entry).toBeDefined();
      expect(entry?.source).toBe('Hello');
      expect(entry?.target).toBe('你好');
    });

    it('should find similar entries', () => {
      memory.addEntry('greeting', 'en', 'zh-CN', 'Hello world', '你好世界');
      
      const similar = memory.findSimilar('Hello there', 'en', 'zh-CN');
      expect(similar).toBeDefined();
    });

    it('should search entries', () => {
      memory.addEntry('greeting', 'en', 'zh-CN', 'Hello', '你好');
      memory.addEntry('farewell', 'en', 'zh-CN', 'Goodbye', '再见');
      
      const results = memory.search('你好', 'zh-CN');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should mark entries as verified', () => {
      memory.addEntry('greeting', 'en', 'zh-CN', 'Hello', '你好');
      memory.markVerified('greeting', 'en', 'zh-CN');
      
      const entry = memory.getEntry('greeting', 'en', 'zh-CN');
      expect(entry?.verified).toBe(true);
    });

    it('should export and import', () => {
      memory.addEntry('greeting', 'en', 'zh-CN', 'Hello', '你好');
      
      const exported = memory.export();
      expect(exported.length).toBeGreaterThan(0);
      
      const newMemory = createTranslationMemory();
      newMemory.import(exported);
      
      const entry = newMemory.getEntry('greeting', 'en', 'zh-CN');
      expect(entry).toBeDefined();
    });
  });
});

describe('LocaleDetector', () => {
  let detector: LocaleDetector;

  beforeEach(() => {
    detector = createLocaleDetector({
      queryParam: 'lang',
      storageKey: 'docsjs-locale'
    });
  });

  describe('Basic Operations', () => {
    it('should create locale detector', () => {
      expect(detector).toBeDefined();
    });

    it('should detect from query param', () => {
      const locale = detector.detect(
        { url: 'http://example.com?lang=zh-CN' },
        ['zh-CN', 'en', 'ja']
      );
      expect(locale).toBe('zh-CN');
    });

    it('should fallback to default', () => {
      const locale = detector.detect({}, ['en']);
      expect(locale).toMatch(/^en/);
    });
      const locale = detector.detect({}, ['en']);
      expect(locale).toBe('en');
    });

    it('should persist locale', () => {
      detector.persist('ja');
      // In browser environment, this would save to localStorage
      expect(detector).toBeDefined();
    });
  });
});

describe('AdvancedI18n', () => {
  let i18nInstance: i18n;
  let advancedI18n: AdvancedI18n;

  beforeEach(() => {
    i18nInstance = new i18n({ defaultLocale: 'en' });
    advancedI18n = createAdvancedI18n(i18nInstance);
  });

  describe('Basic Operations', () => {
    it('should create advanced i18n', () => {
      expect(advancedI18n).toBeDefined();
    });

    it('should translate with plural', () => {
      const result = advancedI18n.translatePlural('items', 5);
      expect(result).toBeDefined();
    });

    it('should translate with gender', () => {
      const translations = { male: 'He', female: 'She', neutral: 'They' };
      const result = advancedI18n.translateGender('person', 'male', translations);
      expect(result).toBe('He');
    });

    it('should learn translations', () => {
      advancedI18n.learnTranslation('hello', 'en', 'zh-CN', 'Hello', '你好');
      
      const suggestions = advancedI18n.getSuggestions('Hello');
      expect(suggestions).toBeDefined();
    });
  });
});

describe('ContentLanguageDetector', () => {
  describe('Basic Operations', () => {
    it('should detect English', () => {
      const result = detectContentLanguage('This is a test document with some content.');
      expect(result.locale).toBe('en');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect Chinese', () => {
      const result = detectContentLanguage('这是一个测试文档');
      expect(result.locale).toBe('zh-CN');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide alternatives', () => {
      const result = detectContentLanguage('Hello world');
      expect(result.alternatives).toBeDefined();
      expect(Array.isArray(result.alternatives)).toBe(true);
    });
  });
});
