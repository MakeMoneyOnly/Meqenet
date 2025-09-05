/**
 * Shared library exports
 *
 * This file serves as the main entry point for shared functionality
 * across the Meqenet frontend applications.
 */

// Export i18n functionality with backward compatibility
export { default as i18n } from './i18n/index.js';
export {
  initI18n,
  supportedLanguages,
  changeLanguage,
  getAvailableLanguages,
  getLanguageDirection,
  isLanguageSupported,
  formatCurrency,
  formatDate,
  formatNumber,
} from './i18n/index.js';

// Re-export types for TypeScript consumers
export type { SupportedLanguageCode } from './i18n/index.js';
