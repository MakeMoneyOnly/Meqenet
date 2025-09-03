/**
 * i18n Middleware
 * Detects and sets the language from request headers or query params
 *
 * Created by: Senior Backend Developer
 * Context: Stage 2 - Error Handling & API Documentation Strategy
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nService } from './i18n.service';

export interface I18nRequest extends Request {
  language?: string;
  locale?: string;
  i18n?: I18nService;
}

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(private readonly i18nService: I18nService) {}

  use(req: I18nRequest, res: Response, next: NextFunction) {
    // Priority order for language detection:
    // 1. Query parameter (?lang=am)
    // 2. Cookie (lang=am)
    // 3. Accept-Language header
    // 4. Default language

    let detectedLanguage: string | undefined;

    // Check query parameter
    if (req.query?.lang) {
      detectedLanguage = req.query.lang as string;
    }

    // Check cookie
    if (!detectedLanguage && req.cookies?.lang) {
      detectedLanguage = req.cookies.lang;
    }

    // Check Accept-Language header
    if (!detectedLanguage && req.headers['accept-language']) {
      const acceptLanguage = req.headers['accept-language'];
      const languages = this.parseAcceptLanguage(acceptLanguage);

      // Find first supported language
      for (const lang of languages) {
        if (this.i18nService.isLanguageSupported(lang)) {
          detectedLanguage = lang;
          break;
        }
      }
    }

    // Validate and set language
    if (
      detectedLanguage &&
      this.i18nService.isLanguageSupported(detectedLanguage)
    ) {
      req.language = detectedLanguage;
      req.locale = detectedLanguage;
      this.i18nService.setLanguage(detectedLanguage);
    } else {
      // Use default language
      req.language = 'en';
      req.locale = 'en';
      this.i18nService.setLanguage('en');
    }

    // Attach i18n service to request for easy access
    req.i18n = this.i18nService;

    // Set Content-Language header
    res.setHeader('Content-Language', req.language);

    next();
  }

  /**
   * Parse Accept-Language header
   * Example: "en-US,en;q=0.9,am;q=0.8" -> ['en', 'am']
   */
  private parseAcceptLanguage(acceptLanguage: string): string[] {
    const languages: { lang: string; quality: number }[] = [];

    const parts = acceptLanguage.toLowerCase().split(',');

    for (const part of parts) {
      const [lang, qPart] = part.trim().split(';');
      const language = lang.split('-')[0]; // Get primary language code

      let quality = 1;
      if (qPart) {
        const qValue = qPart.replace('q=', '');
        quality = parseFloat(qValue) || 0;
      }

      // Only add if not already in list
      if (!languages.find(l => l.lang === language)) {
        languages.push({ lang: language, quality });
      }
    }

    // Sort by quality descending
    languages.sort((a, b) => b.quality - a.quality);

    return languages.map(l => l.lang);
  }
}
