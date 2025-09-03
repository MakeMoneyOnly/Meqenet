/**
 * Backend i18n Service
 * Handles translation for error messages and API responses
 * 
 * Created by: Senior Backend Developer
 * Context: Stage 2 - Error Handling & API Documentation Strategy
 */

import { Injectable, Inject } from '@nestjs/common';
import * as i18n from 'i18n';
import * as path from 'path';
import { I18nModuleOptions } from './i18n.module';

export interface TranslationOptions {
  lang?: string;
  defaultValue?: string;
  args?: Record<string, any>;
}

@Injectable()
export class I18nService {
  private readonly i18nInstance: typeof i18n;

  constructor(@Inject('I18N_OPTIONS') private options: I18nModuleOptions) {
    this.i18nInstance = i18n;
    this.initializeI18n();
  }

  private initializeI18n() {
    this.i18nInstance.configure({
      locales: this.options.supportedLanguages || ['en', 'am'],
      defaultLocale: this.options.defaultLanguage || 'en',
      fallbacks: { am: 'en' },
      directory: path.join(__dirname, '..', this.options.localesPath || 'locales'),
      objectNotation: true,
      updateFiles: false,
      syncFiles: false,
      cookie: 'lang',
      queryParameter: 'lang',
      header: 'accept-language',
      register: global,
      api: {
        __: 'translate',
        __n: 'translateN'
      }
    });
  }

  /**
   * Translate a key with optional parameters
   */
  translate(key: string, options?: TranslationOptions): string {
    const { lang, defaultValue, args } = options || {};
    
    // Set the locale for this translation
    if (lang && this.isLanguageSupported(lang)) {
      this.i18nInstance.setLocale(lang);
    }

    // Perform the translation
    if (args) {
      return this.i18nInstance.__({ phrase: key, locale: lang }, args);
    }

    return this.i18nInstance.__({ phrase: key, locale: lang }) || defaultValue || key;
  }

  /**
   * Translate plural forms
   */
  translatePlural(
    singular: string,
    plural: string,
    count: number,
    options?: TranslationOptions
  ): string {
    const { lang, args } = options || {};
    
    if (lang && this.isLanguageSupported(lang)) {
      this.i18nInstance.setLocale(lang);
    }

    return this.i18nInstance.__n(
      { singular, plural, count, locale: lang },
      count,
      args
    );
  }

  /**
   * Get all translations for a specific locale
   */
  getTranslations(lang: string): Record<string, any> {
    if (!this.isLanguageSupported(lang)) {
      lang = this.options.defaultLanguage || 'en';
    }
    return this.i18nInstance.getCatalog(lang);
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(lang: string): boolean {
    return (this.options.supportedLanguages || ['en', 'am']).includes(lang);
  }

  /**
   * Get the current language
   */
  getCurrentLanguage(): string {
    return this.i18nInstance.getLocale();
  }

  /**
   * Set the current language
   */
  setLanguage(lang: string): void {
    if (this.isLanguageSupported(lang)) {
      this.i18nInstance.setLocale(lang);
    }
  }

  /**
   * Format error messages with i18n
   */
  formatError(
    code: string,
    statusCode: number,
    options?: TranslationOptions
  ): {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    locale: string;
  } {
    const message = this.translate(`errors.${code}`, {
      ...options,
      defaultValue: this.translate('errors.general', options)
    });

    return {
      statusCode,
      message,
      error: code,
      timestamp: new Date().toISOString(),
      locale: options?.lang || this.getCurrentLanguage()
    };
  }

  /**
   * Format success messages with i18n
   */
  formatSuccess(
    messageKey: string,
    data?: any,
    options?: TranslationOptions
  ): {
    success: true;
    message: string;
    data?: any;
    timestamp: string;
    locale: string;
  } {
    const message = this.translate(messageKey, options);

    return {
      success: true,
      message,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
      locale: options?.lang || this.getCurrentLanguage()
    };
  }

  /**
   * Get error message for validation errors
   */
  getValidationError(field: string, rule: string, options?: TranslationOptions): string {
    const key = `validation.${rule}`;
    return this.translate(key, {
      ...options,
      args: { field, ...options?.args }
    });
  }

  /**
   * Format currency for Ethiopian Birr
   */
  formatCurrency(amount: number, lang?: string): string {
    const locale = lang === 'am' ? 'am-ET' : 'en-ET';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Format date based on locale
   */
  formatDate(date: Date, lang?: string): string {
    const locale = lang === 'am' ? 'am-ET' : 'en-ET';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Format numbers based on locale
   */
  formatNumber(value: number, lang?: string): string {
    const locale = lang === 'am' ? 'am-ET' : 'en-ET';
    return new Intl.NumberFormat(locale).format(value);
  }
}