/** @type {import('next-i18next').UserConfig} */

module.exports = {
  // debug: process.env.NODE_ENV === 'development',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'am'],
    localeDetection: false, // Disable automatic routing for now
  },
  ns: ['common'],
  defaultNS: 'common',
  serializeConfig: false,
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  // Enterprise-grade security and performance settings
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false, // Disable suspense for SSR compatibility
    bindI18n: 'languageChanged loaded',
    bindI18nStore: 'added removed',
    transEmptyNodeValue: '',
    transSupportBasicHtmlNodes: true,
    transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  },
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    caches: ['localStorage'],
    lookupLocalStorage: 'i18nextLng',
  },
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  // Fintech-grade auditability
  saveMissing: false,
  missingKeyHandler: (lngs, ns, key, _fallbackValue) => {
    // Log missing keys for audit purposes in development
    // Note: _fallbackValue parameter is intentionally unused but kept for API compatibility
    if (typeof window !== 'undefined' && window.console && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- intentional dev-time translation logging
      console.warn(`Missing translation: ${key} in namespace: ${ns} for languages: ${lngs.join(', ')}`);
    }
  },
};
