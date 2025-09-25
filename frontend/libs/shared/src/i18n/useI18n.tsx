/**
 * React Hook for i18n
 * Provides easy access to translation functions in React components
 *
 * Created by: Senior Mobile Developer, UX Designer
 * Context: Stage 2 - API Documentation Strategy & Error Handling
 */

import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  changeLanguage,
  getAvailableLanguages,
  SupportedLanguageCode,
  formatCurrency,
  formatDate,
  formatNumber,
  getLanguageDirection,
} from './index';

export interface UseI18nReturn {
  // Core translation function
  t: (key: string, options?: Record<string, unknown>) => string;

  // Current language
  language: string;

  // Language direction
  direction: 'ltr' | 'rtl';

  // Change language function
  changeLanguage: (lng: SupportedLanguageCode) => Promise<void>;

  // Available languages
  languages: Array<{ code: string; name: string; dir: string }>;

  // Formatting functions

  formatCurrency: (amount: number) => string;

  formatDate: (date: Date | string) => string;

  formatNumber: (value: number) => string;

  // Loading state
  isLoading: boolean;

  // Ready state
  isReady: boolean;
}

/**
 * Custom hook for i18n functionality
 */
export function useI18n(namespace?: string): UseI18nReturn {
  const { t, i18n, ready } = useTranslation(namespace);
  const [isLoading, setIsLoading] = useState(false);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    setDirection(getLanguageDirection(i18n.language));
  }, [i18n.language]);

  const handleChangeLanguage = async (
    lng: SupportedLanguageCode,
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await changeLanguage(lng);
      setDirection(getLanguageDirection(lng));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrencyWithLocale = (amount: number): string => {
    return formatCurrency(amount, i18n.language);
  };

  const formatDateWithLocale = (date: Date | string): string => {
    return formatDate(date, i18n.language);
  };

  const formatNumberWithLocale = (value: number): string => {
    return formatNumber(value, i18n.language);
  };

  return {
    t,
    language: i18n.language,
    direction,
    changeLanguage: handleChangeLanguage,
    languages: getAvailableLanguages(),
    formatCurrency: formatCurrencyWithLocale,
    formatDate: formatDateWithLocale,
    formatNumber: formatNumberWithLocale,
    isLoading,
    isReady: ready,
  };
}

/**
 * Hook for error messages translation
 */
export function useErrorTranslation(): {
  getErrorMessage: (errorCode: string, defaultMessage?: string) => string;

  getValidationError: (
    field: string,
    rule: string,
    params?: Record<string, unknown>,
  ) => string;
} {
  const { t } = useTranslation();

  const getErrorMessage = (
    errorCode: string,
    defaultMessage?: string,
  ): string => {
    const key = `errors.${errorCode}`;
    const translation = t(key);

    // If translation key not found, return default message or the error code
    if (translation === key) {
      return defaultMessage || errorCode;
    }

    return translation;
  };

  const getValidationError = (
    field: string,
    rule: string,
    params?: Record<string, unknown>,
  ): string => {
    return t(`validation.${rule}`, { field, ...params });
  };

  return {
    getErrorMessage,
    getValidationError,
  };
}

/**
 * Hook for success messages translation
 */
export function useSuccessTranslation(): {
  getSuccessMessage: (key: string, params?: Record<string, unknown>) => string;
} {
  const { t } = useTranslation();

  const getSuccessMessage = (
    key: string,
    params?: Record<string, unknown>,
  ): string => {
    return t(`success.${key}`, params);
  };

  return {
    getSuccessMessage,
  };
}
