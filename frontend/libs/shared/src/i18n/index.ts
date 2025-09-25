/**
 * Meqenet i18n Configuration
 * Supports English and Amharic (አማርኛ) languages
 *
 * Created by: Senior Mobile Developer, UX Designer
 * Context: Stage 2 - API Documentation Strategy & Error Handling
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import locale resources
import enTranslations from './locales/en.json';
import amTranslations from './locales/am.json';

// Define supported languages
export const supportedLanguages = {
  en: {
    code: 'en',
    name: 'English',
    dir: 'ltr',
  },
  am: {
    code: 'am',
    name: 'አማርኛ', // Amharic
    dir: 'ltr', // Amharic is left-to-right
  },
};

// Type constants for runtime type checking
export const SUPPORTED_LANGUAGE_CODES = ['en', 'am'];
export const LANGUAGE_DIRECTIONS = ['ltr', 'rtl'];

// Type definition moved inline to avoid webpack issues

// Configure i18n
const initI18n = (isClient = true) => {
  const i18nInstance = i18n.use(initReactI18next);

  // Use language detector and backend only on client
  if (isClient) {
    i18nInstance.use(LanguageDetector).use(Backend);
  }

  i18nInstance.init({
    resources: {
      en: {
        translation: enTranslations,
      },
      am: {
        translation: amTranslations,
      },
    },
    fallbackLng: 'en',
    lng: 'en', // Default language
    debug: false, // Disable debug in production for security

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
      format: function (value, format, lng) {
        // Custom formatting for dates, numbers, and currency
        if (format === 'currency') {
          return formatCurrency(value, lng);
        }
        if (format === 'date') {
          return formatDate(value, lng);
        }
        if (format === 'number') {
          return formatNumber(value, lng);
        }
        return value;
      },
    },

    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },

    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',

    // Performance optimization
    load: 'languageOnly',
    preload: ['en', 'am'],

    // Accessibility support
    returnEmptyString: false,
    returnNull: false,

    saveMissing: false, // Disable in production for security
    missingKeyHandler: (_lngs, _ns, key, _fallbackValue) => {
      // Silently handle missing keys in production for security
      // In development, missing keys would be logged by i18next debug mode
      if (typeof window !== 'undefined' && window.console) {
        console.warn(`Missing translation: ${key}`);
      }
    },
  });

  return i18nInstance;
};

/**
 * Currency formatter for Ethiopian Birr
 */
const formatCurrency = (value: number, lng?: string): string => {
  const formatter = new Intl.NumberFormat(lng === 'am' ? 'am-ET' : 'en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(value);
};

/**
 * Date formatter
 */
const formatDate = (value: Date | string, lng?: string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const formatter = new Intl.DateTimeFormat(lng === 'am' ? 'am-ET' : 'en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return formatter.format(date);
};

/**
 * Number formatter
 */
const formatNumber = (value: number, lng?: string): string => {
  const formatter = new Intl.NumberFormat(lng === 'am' ? 'am-ET' : 'en-ET');
  return formatter.format(value);
};

/**
 * Helper to get current language direction
 * @param {string} lng - The language code
 * @returns {string} The text direction ('ltr' or 'rtl')
 */
export const getLanguageDirection = (lng: string): 'ltr' | 'rtl' => {
  // Safe property access with fallback for object injection protection
  const lang = supportedLanguages[lng as 'en' | 'am'];
  return lang ? (lang.dir as 'ltr' | 'rtl') : 'ltr';
};

/**
 * Language change handler
 * @param {string} lng - The language code to switch to
 * @returns {Promise<void>}
 */
export const changeLanguage = async (lng: 'en' | 'am'): Promise<void> => {
  // Validate that the language is supported
  if (!SUPPORTED_LANGUAGE_CODES.includes(lng)) {
    console.warn(`Unsupported language: ${lng}`);
    return;
  }

  await i18n.changeLanguage(lng);
  // Update HTML dir attribute for proper text direction
  if (typeof document !== 'undefined') {
    document.documentElement.dir = getLanguageDirection(lng);
    document.documentElement.lang = lng;
  }
};

/**
 * Get all available languages for language switcher
 * @returns {Array<{code: string, name: string, dir: string}>} Array of language objects
 */
export const getAvailableLanguages = () => {
  return Object.values(supportedLanguages);
};

/**
 * Check if language is supported
 * @param {string} lng - The language code to check
 * @returns {boolean} Whether the language is supported
 */
export const isLanguageSupported = (lng: string): boolean => {
  return SUPPORTED_LANGUAGE_CODES.includes(lng);
};

// Export configured instance - conditionally initialize for SSR compatibility
let defaultInstance: typeof i18n;

if (typeof window !== 'undefined') {
  // Client-side: initialize immediately
  defaultInstance = initI18n(true);
} else {
  // Server-side: create a minimal instance to avoid SSR errors
  defaultInstance = i18n.createInstance();
  defaultInstance.init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: { translation: enTranslations },
      am: { translation: amTranslations },
    },
  });
}

export default defaultInstance;

// Export utility functions for use in components
export { initI18n, formatCurrency, formatDate, formatNumber };
