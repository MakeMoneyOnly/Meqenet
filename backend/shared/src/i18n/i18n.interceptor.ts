/**
 * i18n Interceptor
 * Automatically translates response messages based on request language
 *
 * Created by: Senior Backend Developer
 * Context: Stage 2 - Error Handling & API Documentation Strategy
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from './i18n.service';
import { I18nRequest } from './i18n.middleware';

@Injectable()
export class I18nInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<I18nRequest>();
    const language = request.language || 'en';

    return next.handle().pipe(
      map(data => {
        // If response has a message key, translate it
        if (data && typeof data === 'object') {
          if (data.messageKey) {
            data.message = this.i18nService.translate(data.messageKey, {
              lang: language,
              args: data.messageArgs,
            });
            delete data.messageKey;
            delete data.messageArgs;
          }

          // Add locale information to response
          if (!data.locale) {
            data.locale = language;
          }

          // Translate nested error messages
          if (data.errors && Array.isArray(data.errors)) {
            data.errors = data.errors.map(error => {
              if (error.messageKey) {
                return {
                  ...error,
                  message: this.i18nService.translate(error.messageKey, {
                    lang: language,
                    args: error.messageArgs,
                  }),
                };
              }
              return error;
            });
          }

          // Format currency values if present
          if (data.amount !== undefined && typeof data.amount === 'number') {
            data.formattedAmount = this.i18nService.formatCurrency(
              data.amount,
              language
            );
          }

          // Format dates if present
          if (data.date && !data.formattedDate) {
            const dateObj = new Date(data.date);
            if (!isNaN(dateObj.getTime())) {
              data.formattedDate = this.i18nService.formatDate(
                dateObj,
                language
              );
            }
          }
        }

        return data;
      })
    );
  }
}
