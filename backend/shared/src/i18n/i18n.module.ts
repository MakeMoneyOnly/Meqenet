/**
 * Backend i18n Module
 * Provides internationalization support for error messages and API responses
 *
 * Created by: Senior Backend Developer
 * Context: Stage 2 - Error Handling & API Documentation Strategy
 */

import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nService } from './i18n.service';
import { I18nMiddleware } from './i18n.middleware';
import { I18nInterceptor } from './i18n.interceptor';

export interface I18nModuleOptions {
  defaultLanguage?: string;
  supportedLanguages?: string[];
  fallbackLanguage?: string;
  localesPath?: string;
}

@Global()
@Module({})
export class I18nModule {
  static forRoot(options: I18nModuleOptions = {}): DynamicModule {
    const defaultOptions: I18nModuleOptions = {
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'am'],
      fallbackLanguage: 'en',
      localesPath: 'locales',
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return {
      module: I18nModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'I18N_OPTIONS',
          useValue: mergedOptions,
        },
        I18nService,
        I18nInterceptor,
        I18nMiddleware,
      ],
      exports: [I18nService, I18nInterceptor],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: I18nModule,
      providers: [I18nService, I18nInterceptor],
      exports: [I18nService, I18nInterceptor],
    };
  }
}
