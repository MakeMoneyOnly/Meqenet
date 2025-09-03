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
    dir: 'ltr'
  },
  am: { 
    code: 'am', 
    name: 'አማርኛ',  // Amharic
    dir: 'ltr'     // Amharic is left-to-right
  }
} as const;

export type SupportedLanguageCode = keyof typeof supportedLanguages;

// Configure i18n
const initI18n = (isClient: boolean = true) => {
  const i18nInstance = i18n.use(initReactI18next);
  
  // Use language detector and backend only on client
  if (isClient) {
    i18nInstance
      .use(LanguageDetector)
      .use(Backend);
  }

  i18nInstance.init({
    resources: {
      en: {
        translation: enTranslations
      },
      am: {
        translation: amTranslations
      }
    },
    fallbackLng: 'en',
    lng: 'en', // Default language
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
      format: function(value, format, lng) {
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
      }
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
    
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${key}`);
      }
    }
  });

  return i18nInstance;
};

// Currency formatter for Ethiopian Birr
const formatCurrency = (value: number, lng?: string): string => {
  const formatter = new Intl.NumberFormat(lng === 'am' ? 'am-ET' : 'en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(value);
};

// Date formatter
const formatDate = (value: Date | string, lng?: string): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const formatter = new Intl.DateTimeFormat(lng === 'am' ? 'am-ET' : 'en-ET', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return formatter.format(date);
};

// Number formatter
const formatNumber = (value: number, lng?: string): string => {
  const formatter = new Intl.NumberFormat(lng === 'am' ? 'am-ET' : 'en-ET');
  return formatter.format(value);
};

// Helper to get current language direction
export const getLanguageDirection = (lng: string): 'ltr' | 'rtl' => {
  return supportedLanguages[lng as SupportedLanguageCode]?.dir || 'ltr';
};

// Language change handler
export const changeLanguage = async (lng: SupportedLanguageCode) => {
  await i18n.changeLanguage(lng);
  // Update HTML dir attribute for proper text direction
  if (typeof document !== 'undefined') {
    document.documentElement.dir = getLanguageDirection(lng);
    document.documentElement.lang = lng;
  }
};

// Get all available languages for language switcher
export const getAvailableLanguages = () => {
  return Object.values(supportedLanguages);
};

// Check if language is supported
export const isLanguageSupported = (lng: string): lng is SupportedLanguageCode => {
  return lng in supportedLanguages;
};

// Export configured instance
export default initI18n();

// Export utility functions for use in components
export { 
  initI18n,
  formatCurrency,
  formatDate,
  formatNumber
};