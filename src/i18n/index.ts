/**
 * Internationalization (i18n) Module
 * 
 * Provides multi-language support for DocsJS.
 */

export type Locale = string;
export type TranslationKey = string;
export type TranslationValue = string | Record<string, unknown>;

export interface Translations {
  [key: TranslationKey]: TranslationValue;
}

export interface LocaleConfig {
  locale: Locale;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
  dateFormat?: string;
  numberFormat?: string;
}

export interface i18nOptions {
  defaultLocale?: Locale;
  fallbackLocale?: Locale;
  initialLocale?: Locale;
}

const SUPPORTED_LOCALES: LocaleConfig[] = [
  { locale: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { locale: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', direction: 'ltr' },
  { locale: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', direction: 'ltr' },
  { locale: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { locale: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { locale: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { locale: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { locale: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { locale: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr' },
  { locale: 'ru', name: 'Russian', nativeName: 'Русский', direction: 'ltr' },
  { locale: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
  { locale: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' },
  { locale: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', direction: 'ltr' },
  { locale: 'it', name: 'Italian', nativeName: 'Italiano', direction: 'ltr' },
  { locale: 'th', name: 'Thai', nativeName: 'ไทย', direction: 'ltr' },
  { locale: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', direction: 'ltr' },
  { locale: 'nl', name: 'Dutch', nativeName: 'Nederlands', direction: 'ltr' },
  { locale: 'pl', name: 'Polish', nativeName: 'Polski', direction: 'ltr' },
  { locale: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr' },
  { locale: 'uk', name: 'Ukrainian', nativeName: 'Українська', direction: 'ltr' }
];

// Built-in translations
const BUILT_IN_TRANSLATIONS: Record<Locale, Translations> = {
  'en': {
    'app.name': 'DocsJS',
    'app.tagline': 'Document Transformation Platform',
    'convert.title': 'Convert Document',
    'convert.selectFile': 'Select a file to convert',
    'convert.converting': 'Converting...',
    'convert.success': 'Conversion completed successfully',
    'convert.error': 'Conversion failed',
    'profile.default': 'Default Profile',
    'profile.knowledgeBase': 'Knowledge Base',
    'profile.examPaper': 'Exam Paper',
    'profile.enterprise': 'Enterprise',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.format': 'Output Format',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.loading': 'Loading...',
    'error.fileTooLarge': 'File is too large',
    'error.unsupportedFormat': 'Unsupported file format',
    'error.networkError': 'Network error occurred'
  },
  'zh-CN': {
    'app.name': 'DocsJS',
    'app.tagline': '文档转换平台',
    'convert.title': '转换文档',
    'convert.selectFile': '选择要转换的文件',
    'convert.converting': '转换中...',
    'convert.success': '转换成功',
    'convert.error': '转换失败',
    'profile.default': '默认配置',
    'profile.knowledgeBase': '知识库',
    'profile.examPaper': '试卷',
    'profile.enterprise': '企业版',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.format': '输出格式',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.loading': '加载中...',
    'error.fileTooLarge': '文件过大',
    'error.unsupportedFormat': '不支持的文件格式',
    'error.networkError': '网络错误'
  },
  'zh-TW': {
    'app.name': 'DocsJS',
    'app.tagline': '文檔轉換平臺',
    'convert.title': '轉換文檔',
    'convert.selectFile': '選擇要轉換的文件',
    'convert.converting': '轉換中...',
    'convert.success': '轉換成功',
    'convert.error': '轉換失敗',
    'profile.default': '默認配置',
    'profile.knowledgeBase': '知識庫',
    'profile.examPaper': '試卷',
    'profile.enterprise': '企業版',
    'settings.language': '語言',
    'settings.theme': '主題',
    'settings.format': '輸出格式',
    'common.save': '儲存',
    'common.cancel': '取消',
    'common.delete': '刪除',
    'common.edit': '編輯',
    'common.loading': '載入中...',
    'error.fileTooLarge': '文件過大',
    'error.unsupportedFormat': '不支持的文件格式',
    'error.networkError': '網絡錯誤'
  },
  'ja': {
    'app.name': 'DocsJS',
    'app.tagline': 'ドキュメント変換プラットフォーム',
    'convert.title': 'ドキュメント変換',
    'convert.selectFile': '変換するファイルを選択',
    'convert.converting': '変換中...',
    'convert.success': '変換成功',
    'convert.error': '変換失敗',
    'profile.default': 'デフォルト',
    'profile.knowledgeBase': 'ナレッジベース',
    'profile.examPaper': '試験問題',
    'profile.enterprise': 'エンタープライズ',
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.format': '出力形式',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.loading': '読み込み中...',
    'error.fileTooLarge': 'ファイルが大きすぎます',
    'error.unsupportedFormat': 'サポートされていないファイル形式',
    'error.networkError': 'ネットワークエラー'
  },
  'ko': {
    'app.name': 'DocsJS',
    'app.tagline': '문서 변환 플랫폼',
    'convert.title': '문서 변환',
    'convert.selectFile': '변환할 파일 선택',
    'convert.converting': '변환 중...',
    'convert.success': '변환 성공',
    'convert.error': '변환 실패',
    'profile.default': '기본 프로필',
    'profile.knowledgeBase': '지식 베이스',
    'profile.examPaper': '시험지',
    'profile.enterprise': '엔터프라이즈',
    'settings.language': '언어',
    'settings.theme': '테마',
    'settings.format': '출력 형식',
    'common.save': '저장',
    'common.cancel': '취소',
    'common.delete': '삭제',
    'common.edit': '편집',
    'common.loading': '로딩 중...',
    'error.fileTooLarge': '파일이 너무 큽니다',
    'error.unsupportedFormat': '지원되지 않는 파일 형식',
    'error.networkError': '네트워크 오류'
  },
  'es': {
    'app.name': 'DocsJS',
    'app.tagline': 'Plataforma de transformación de documentos',
    'convert.title': 'Convertir documento',
    'convert.selectFile': 'Seleccionar archivo para convertir',
    'convert.converting': 'Convirtiendo...',
    'convert.success': 'Conversión completada',
    'convert.error': 'Error en conversión',
    'profile.default': 'Perfil predeterminado',
    'profile.knowledgeBase': 'Base de conocimientos',
    'profile.examPaper': 'Examen',
    'profile.enterprise': 'Empresarial',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.format': 'Formato de salida',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.loading': 'Cargando...',
    'error.fileTooLarge': 'El archivo es demasiado grande',
    'error.unsupportedFormat': 'Formato de archivo no soportado',
    'error.networkError': 'Error de red'
  }
};

// Add placeholder translations for remaining locales
for (const locale of SUPPORTED_LOCALES) {
  if (!BUILT_IN_TRANSLATIONS[locale.locale]) {
    BUILT_IN_TRANSLATIONS[locale.locale] = BUILT_IN_TRANSLATIONS['en'];
  }
}

export class i18n {
  private currentLocale: Locale;
  private fallbackLocale: Locale;
  private translations: Record<Locale, Translations>;
  private customTranslations: Record<Locale, Translations> = {};
  private listeners: Array<(locale: Locale) => void> = [];

  constructor(options: i18nOptions = {}) {
    this.currentLocale = options.initialLocale || options.defaultLocale || 'en';
    this.fallbackLocale = options.fallbackLocale || 'en';
    this.translations = { ...BUILT_IN_TRANSLATIONS };
  }

  /**
   * Get current locale
   */
  getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * Set current locale
   */
  setLocale(locale: Locale): void {
    if (locale !== this.currentLocale) {
      this.currentLocale = locale;
      this.notifyListeners();
    }
  }

  /**
   * Get all supported locales
   */
  getSupportedLocales(): LocaleConfig[] {
    return SUPPORTED_LOCALES;
  }

  /**
   * Get locale config
   */
  getLocaleConfig(locale: Locale): LocaleConfig | undefined {
    return SUPPORTED_LOCALES.find(l => l.locale === locale);
  }

  /**
   * Add custom translations
   */
  addTranslations(locale: Locale, translations: Translations): void {
    this.customTranslations[locale] = {
      ...this.translations[locale],
      ...translations
    };
    this.translations[locale] = {
      ...this.translations[locale],
      ...translations
    };
  }

  /**
   * Translate a key
   */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    let value = this.customTranslations[this.currentLocale]?.[key] 
      || this.translations[this.currentLocale]?.[key];

    if (value === undefined) {
      value = this.customTranslations[this.fallbackLocale]?.[key]
        || this.translations[this.fallbackLocale]?.[key];
    }

    if (value === undefined) {
      return key; // Return key if not found
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      }
    }

    return value;
  }

  /**
   * Check if a key exists
   */
  exists(key: TranslationKey): boolean {
    return !!(
      this.customTranslations[this.currentLocale]?.[key] ||
      this.translations[this.currentLocale]?.[key] ||
      this.customTranslations[this.fallbackLocale]?.[key] ||
      this.translations[this.fallbackLocale]?.[key]
    );
  }

  /**
   * Get all keys for current locale
   */
  getKeys(): TranslationKey[] {
    const keys = new Set<TranslationKey>();
    
    const addKeys = (translations?: Translations) => {
      if (translations) {
        for (const key of Object.keys(translations)) {
          if (typeof translations[key] === 'string') {
            keys.add(key);
          }
        }
      }
    };

    addKeys(this.customTranslations[this.currentLocale]);
    addKeys(this.translations[this.currentLocale]);
    addKeys(this.customTranslations[this.fallbackLocale]);
    addKeys(this.translations[this.fallbackLocale]);

    return Array.from(keys).sort();
  }

  /**
   * Detect user locale from browser
   */
  detectLocale(): Locale {
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language || (navigator as any).userLanguage;
      
      // Try exact match first
      if (this.isSupportedLocale(browserLang)) {
        return browserLang;
      }

      // Try language code only (e.g., 'zh' from 'zh-CN')
      const langCode = browserLang.split('-')[0];
      const matchedLocale = SUPPORTED_LOCALES.find(
        l => l.locale.startsWith(langCode)
      );
      
      if (matchedLocale) {
        return matchedLocale.locale;
      }
    }

    return this.fallbackLocale;
  }

  /**
   * Check if locale is supported
   */
  isSupportedLocale(locale: Locale): boolean {
    return SUPPORTED_LOCALES.some(l => l.locale === locale);
  }

  /**
   * Get text direction for current locale
   */
  getDirection(): 'ltr' | 'rtl' {
    const config = this.getLocaleConfig(this.currentLocale);
    return config?.direction || 'ltr';
  }

  /**
   * Format number for current locale
   */
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.currentLocale, options).format(value);
  }

  /**
   * Format date for current locale
   */
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string {
    const date = typeof value === 'number' ? new Date(value) : value;
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  /**
   * Subscribe to locale changes
   */
  onLocaleChange(callback: (locale: Locale) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentLocale);
    }
  }
}

// Singleton instance
let i18nInstance: i18n | null = null;

export function createi18n(options?: i18nOptions): i18n {
  return new i18n(options);
}

export function geti18n(): i18n {
  if (!i18nInstance) {
    i18nInstance = new i18n();
  }
  return i18nInstance;
}

export function seti18n(instance: i18n): void {
  i18nInstance = instance;
}

export { SUPPORTED_LOCALES, BUILT_IN_TRANSLATIONS };


export { 
  BidirectionalHandler,
  RTL_STYLES,
  rtlUtils,
  createRTLTransformer,
  isRTLLanguage,
  getTextDirection,
  getCSSDirection,
  transformCSSForRTL
} from './rtl';
export type { RTLConfig, RTLLanguage, TextDirection } from './rtl';