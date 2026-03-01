/**
 * RTL (Right-to-Left) Support Module
 * 
 * Provides RTL language support, bidirectional text handling,
 * and layout mirroring for Arabic, Hebrew, Persian, and other RTL languages.
 */

export type TextDirection = 'ltr' | 'rtl' | 'auto';

/**
 * RTL language configuration
 */
export interface RTLConfig {
  /** Enable bidirectional text support */
  enableBidi?: boolean;
  /** Mirror layout for RTL */
  mirrorLayout?: boolean;
  /** Default direction */
  defaultDirection?: TextDirection;
  /** Base script direction */
  baseScript?: 'latin' | 'arabic' | 'hebrew' | 'mixed';
}

/**
 * RTL language info
 */
export interface RTLLanguage {
  code: string;
  name: string;
  nativeName: string;
  direction: 'rtl' | 'ltr';
  /** Unicode script */
  script: string;
  /** Requires font features */
  fontFeatures?: string[];
}

/**
 * RTL-supported languages
 */
export const RTL_LANGUAGES: RTLLanguage[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', script: 'Arab' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', direction: 'rtl', script: 'Hebr' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', direction: 'rtl', script: 'Arab' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', script: 'Arab' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', direction: 'rtl', script: 'Hebr' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', direction: 'rtl', script: 'Arab' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', direction: 'rtl', script: 'Arab' },
];

/**
 * Check if a language is RTL
 */
export function isRTLLanguage(locale: string): boolean {
  return RTL_LANGUAGES.some(lang => lang.code === locale || lang.code.startsWith(locale));
}

/**
 * Get text direction for locale
 */
export function getTextDirection(locale: string): TextDirection {
  const rtl = RTL_LANGUAGES.find(lang => lang.code === locale || locale.startsWith(lang.code));
  return rtl?.direction || 'ltr';
}

/**
 * Get CSS direction value
 */
export function getCSSDirection(locale: string): string {
  return isRTLLanguage(locale) ? 'rtl' : 'ltr';
}

/**
 * Apply RTL transformation to CSS
 */
export function transformCSSForRTL(css: string, enable: boolean = true): string {
  if (!enable) return css;

  const rtlReplacements: Record<string, string> = {
    'margin-left': 'margin-right',
    'margin-right': 'margin-left',
    'padding-left': 'padding-right',
    'padding-right': 'padding-left',
    'border-left': 'border-right',
    'border-right': 'border-left',
    'text-align: left': 'text-align: right',
    'text-align: right': 'text-align: left',
    'float: left': 'float: right',
    'float: right': 'float: left',
  };

  let result = css;

  for (const [ltr, rtl] of Object.entries(rtlReplacements)) {
    const regex = new RegExp(ltr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, rtl);
  }

  return result;
}

/**
 * Bidirectional text handler
 */
export class BidirectionalHandler {
  private enableBidi: boolean;

  constructor(enableBidi: boolean = true) {
    this.enableBidi = enableBidi;
  }

  /**
   * Wrap text with Unicode bidirectional marks
   */
  wrapBidiText(text: string, baseDirection: TextDirection = 'auto'): string {
    if (!this.enableBidi) return text;

    const dir = baseDirection === 'auto' ? this.detectBaseDirection(text) : baseDirection;
    const mark = dir === 'rtl' ? '\u202B' : '\u202A';
    const endMark = '\u202C';

    return `${mark}${text}${endMark}`;
  }

  /**
   * Detect base direction of text
   */
  detectBaseDirection(text: string): TextDirection {
    // Strong first character determines direction
    const firstStrong = this.getFirstStrongCharacter(text);
    if (!firstStrong) return 'ltr';

    // Check for RTL Unicode ranges
    const rtlRanges = [
      /[\u0590-\u05FF]/, // Hebrew
      /[\u0600-\u06FF]/, // Arabic
      /[\u0700-\u074F]/, // Syriac
      /[\u0750-\u077F]/, // Arabic Supplement
      /[\u08A0-\u08FF]/, // Arabic Extended-A
      /[\uFB50-\uFDFF]/, // Arabic Presentation Forms-A
      /[\uFE70-\uFEFF]/, // Arabic Presentation Forms-B
    ];

    for (const range of rtlRanges) {
      if (range.test(firstStrong)) {
        return 'rtl';
      }
    }

    return 'ltr';
  }

  /**
   * Get first strong directional character
   */
  private getFirstStrongCharacter(text: string): string | null {
    const strongLTR = /[\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u0100-\u017F\u0180-\u024F]/;
    const strongRTL = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF]/;

    for (const char of text) {
      if (strongLTR.test(char)) return char;
      if (strongRTL.test(char)) return char;
    }

    return null;
  }

  /**
   * Format HTML content for RTL display
   */
  formatHTMLForRTL(html: string, locale: string): string {
    const direction = getCSSDirection(locale);
    
    // Add direction attribute to root element if not present
    if (!html.includes('dir=')) {
      html = html.replace(/<html([^>]*)>/i, `<html$1 dir="${direction}">`);
    }

    // Add direction to body if not present
    if (!html.includes('<body') || !html.match(/<body[^>]*dir=/i)) {
      html = html.replace(/<body([^>]*)>/i, `<body$1 dir="${direction}">`);
    }

    return html;
  }
}

/**
 * RTL-aware styles
 */
export const RTL_STYLES = {
  /**
   * Base RTL-aware CSS
   */
  base: `
    [dir="rtl"] {
      direction: rtl;
      text-align: right;
    }
    
    [dir="rtl"] .text-left {
      text-align: right;
    }
    
    [dir="rtl"] .text-right {
      text-align: left;
    }
    
    [dir="rtl"] .float-left {
      float: right;
    }
    
    [dir="rtl"] .float-right {
      float: left;
    }
    
    [dir="rtl"] .ml-auto {
      margin-left: 0;
      margin-right: auto;
    }
    
    [dir="rtl"] .mr-auto {
      margin-right: 0;
      margin-left: auto;
    }
    
    [dir="rtl"] .pl-0 {
      padding-left: 0;
      padding-right: 0;
    }
    
    [dir="rtl"] .pr-0 {
      padding-right: 0;
      padding-left: 0;
    }
  `,

  /**
   * Bidirectional-aware input styles
   */
  inputs: `
    [dir="rtl"] input,
    [dir="rtl"] textarea {
      text-align: right;
    }
    
    [dir="rtl"] input[type="checkbox"],
    [dir="rtl"] input[type="radio"] {
      margin-left: 0.5em;
      margin-right: 0;
    }
  `,

  /**
   * Table RTL styles
   */
  tables: `
    [dir="rtl"] table {
      direction: rtl;
    }
    
    [dir="rtl"] th {
      text-align: right;
    }
    
    [dir="rtl"] td {
      text-align: right;
    }
  `,

  /**
   * List RTL styles
   */
  lists: `
    [dir="rtl"] ul,
    [dir="rtl"] ol {
      padding-left: 0;
      padding-right: 1.5em;
    }
    
    [dir="rtl"] dd {
      margin-left: 0;
      margin-right: 1.5em;
    }
  `,
};

/**
 * RTL utilities
 */
export const rtlUtils = {
  /**
   * Mirror a value based on direction
   */
  mirror: (value: string, direction: 'ltr' | 'rtl'): string => {
    const mirrors: Record<string, string> = {
      'left': 'right',
      'right': 'left',
      'L': 'R',
      'R': 'L',
    };
    return mirrors[value] || value;
  },

  /**
   * Get start/end instead of left/right
   */
  startEnd: (direction: 'ltr' | 'rtl'): { start: string; end: string } => {
    return direction === 'rtl' 
      ? { start: 'right', end: 'left' }
      : { start: 'left', end: 'right' };
  },

  /**
   * Check if character is RTL
   */
  isRTLChar: (char: string): boolean => {
    const code = char.charCodeAt(0);
    return (code >= 0x0590 && code <= 0x05FF) ||  // Hebrew
           (code >= 0x0600 && code <= 0x06FF) ||  // Arabic
           (code >= 0x0700 && code <= 0x074F);     // Syriac
  },

  /**
   * Flip icon based on direction
   */
  flipIcon: (iconName: string, direction: 'ltr' | 'rtl'): string => {
    const flipOnRTL = ['arrow-left', 'arrow-right', 'chevron-left', 'chevron-right', 'back', 'forward'];
    if (!flipOnRTL.includes(iconName)) return iconName;
    
    if (direction === 'rtl') {
      return iconName.replace('left', '___temp').replace('right', 'left').replace('___temp', 'right');
    }
    return iconName;
  },
};

/**
 * Create RTL transformer
 */
export function createRTLTransformer(config?: RTLConfig): BidirectionalHandler {
  return new BidirectionalHandler(config?.enableBidi ?? true);
}
