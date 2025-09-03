# Meqenet Internationalization (i18n) Implementation Guide

## Overview

This document provides comprehensive documentation for the internationalization (i18n) framework implemented across the Meqenet platform, supporting both English and Amharic (አማርኛ) languages.

**Implementation Date:** January 5, 2025  
**Implemented By:** Senior Mobile Developer, Senior Backend Developer, UX Designer  
**Context:** Stage 2 - API Documentation Strategy & Error Handling

## Architecture

### Frontend i18n (React/React Native)

The frontend uses `react-i18next` for managing translations across both web (Next.js) and mobile (React Native) applications.

#### Key Files

- `/frontend/libs/shared/src/i18n/index.ts` - Main configuration
- `/frontend/libs/shared/src/i18n/useI18n.tsx` - React hooks
- `/frontend/libs/shared/src/i18n/locales/en.json` - English translations
- `/frontend/libs/shared/src/i18n/locales/am.json` - Amharic translations
- `/frontend/libs/shared-ui/src/components/LanguageSwitcher.tsx` - Language switcher component

### Backend i18n (NestJS)

The backend uses a custom i18n module built on top of the `i18n` package for translating error messages and API responses.

#### Key Files

- `/backend/shared/src/i18n/i18n.module.ts` - NestJS module configuration
- `/backend/shared/src/i18n/i18n.service.ts` - Translation service
- `/backend/shared/src/i18n/i18n.middleware.ts` - Request language detection
- `/backend/shared/src/i18n/i18n.interceptor.ts` - Response translation
- `/backend/shared/src/locales/en.json` - English translations
- `/backend/shared/src/locales/am.json` - Amharic translations

## Features

### Supported Languages

- **English (en)** - Default language
- **Amharic (am)** - አማርኛ - Primary local language for Ethiopian market

### Language Detection Priority

1. Query parameter (`?lang=am`)
2. Cookie (`lang=am`)
3. Accept-Language header
4. Default language (English)

### Formatting Support

- **Currency**: Ethiopian Birr (ETB) formatting
- **Dates**: Locale-specific date formatting
- **Numbers**: Locale-specific number formatting

## Frontend Usage

### Basic Translation

```typescript
import { useI18n } from '@shared/i18n/useI18n';

function MyComponent() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('auth.signIn')}</button>
    </div>
  );
}
```

### With Parameters

```typescript
const { t } = useI18n();
const message = t('notifications.paymentReminder', { 
  amount: 1000, 
  date: '2025-01-10' 
});
// Output (EN): "Payment of 1000 due on 2025-01-10"
// Output (AM): "1000 ብር ክፍያ በ2025-01-10 የሚደርስ"
```

### Currency Formatting

```typescript
const { formatCurrency } = useI18n();
const formatted = formatCurrency(5000);
// Output (EN): "ETB 5,000.00"
// Output (AM): "ብር 5,000.00"
```

### Language Switching

```typescript
import { LanguageSwitcher } from '@shared-ui/components/LanguageSwitcher';

function Header() {
  return (
    <nav>
      <LanguageSwitcher variant="dropdown" size="medium" />
    </nav>
  );
}
```

### Error Handling

```typescript
import { useErrorTranslation } from '@shared/i18n/useI18n';

function ErrorHandler({ errorCode }) {
  const { getErrorMessage } = useErrorTranslation();
  const message = getErrorMessage(errorCode, 'An error occurred');
  
  return <Alert type="error">{message}</Alert>;
}
```

## Backend Usage

### Module Setup

```typescript
import { I18nModule } from '@shared/i18n';

@Module({
  imports: [
    I18nModule.forRoot({
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'am'],
      fallbackLanguage: 'en',
      localesPath: 'locales'
    }),
  ],
})
export class AppModule {}
```

### In Controllers

```typescript
import { I18nService } from '@shared/i18n';

@Controller('auth')
export class AuthController {
  constructor(private i18n: I18nService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: I18nRequest) {
    // Language is automatically detected from request
    const lang = req.language;
    
    // Success response
    return this.i18n.formatSuccess('success.loginSuccess', 
      { userId: user.id }, 
      { lang }
    );
    
    // Error response
    throw new UnauthorizedException(
      this.i18n.formatError('invalidCredentials', 401, { lang })
    );
  }
}
```

### Validation Errors

```typescript
const errorMessage = this.i18n.getValidationError(
  'email', 
  'required', 
  { lang: 'am' }
);
// Output: "ኢሜይል ያስፈልጋል"
```

### Middleware Usage

```typescript
import { I18nMiddleware } from '@shared/i18n';

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(I18nMiddleware)
      .forRoutes('*');
  }
}
```

## Translation Keys Structure

### Frontend Keys

```
common/            - Common UI elements
auth/              - Authentication related
errors/            - Error messages
kyc/               - KYC verification
bnpl/              - Buy Now Pay Later features
payment/           - Payment related
plans/             - Payment plans
dashboard/         - Dashboard UI
marketplace/       - Marketplace features
merchant/          - Merchant portal
profile/           - User profile
rewards/           - Rewards and cashback
financialWellness/ - Financial wellness tools
support/           - Support and help
subscription/      - Meqenet Plus subscription
accessibility/     - Accessibility labels
validation/        - Form validation messages
```

### Backend Keys

```
errors/          - API error messages
validation/      - Validation error messages
success/         - Success response messages
notifications/   - Push/Email notification templates
email/           - Email templates
sms/             - SMS templates
```

## Adding New Translations

### Frontend

1. Add the key to both `/frontend/libs/shared/src/i18n/locales/en.json` and `/am.json`
2. Use the key in your component with `t('section.key')`

### Backend

1. Add the key to both `/backend/shared/src/locales/en.json` and `/am.json`
2. Use the key with `i18n.translate('section.key', options)`

## Best Practices

### 1. Key Naming Convention

- Use nested structure for organization
- Use camelCase for keys
- Be descriptive but concise

```json
{
  "payment": {
    "methods": {
      "telebirr": "Telebirr",
      "selectMethod": "Select Payment Method"
    }
  }
}
```

### 2. Parameter Placeholders

Use double curly braces for dynamic values:

```json
{
  "welcome": "Welcome {{name}}",
  "balance": "Your balance is {{amount}}"
}
```

### 3. Pluralization

```typescript
const message = i18n.translatePlural(
  'You have one notification',
  'You have {{count}} notifications',
  notificationCount,
  { lang: 'en' }
);
```

### 4. Date and Time

Always use the formatting functions for dates:

```typescript
const { formatDate } = useI18n();
const formatted = formatDate(new Date());
```

### 5. Currency

Always use the formatting function for currency:

```typescript
const { formatCurrency } = useI18n();
const formatted = formatCurrency(amount);
```

## Testing

### Frontend Testing

```typescript
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@shared/i18n';

test('renders with translations', () => {
  const { getByText } = render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  expect(getByText('Welcome to Meqenet')).toBeInTheDocument();
});
```

### Backend Testing

```typescript
describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    service = new I18nService({
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'am']
    });
  });

  it('should translate error message', () => {
    const message = service.translate('errors.general', { lang: 'en' });
    expect(message).toBe('An error occurred. Please try again.');
  });

  it('should format currency correctly', () => {
    const formatted = service.formatCurrency(1000, 'am');
    expect(formatted).toContain('ብር');
  });
});
```

## Performance Considerations

1. **Lazy Loading**: Translations are loaded on demand
2. **Caching**: Language preference is cached in localStorage
3. **Bundle Size**: Each locale file is separate and loaded as needed
4. **Server-Side**: Language detection happens once per request

## Accessibility

All language switching components include:
- ARIA labels
- Keyboard navigation support
- Screen reader announcements
- Focus management

## Migration Guide

For existing components that need i18n:

1. Import the hook: `import { useI18n } from '@shared/i18n/useI18n';`
2. Replace hardcoded strings with `t('key')`
3. Add translations to locale files
4. Test in both languages

## Common Issues and Solutions

### Issue: Translation key shows instead of translation
**Solution**: Check if the key exists in the locale file and the namespace is correct.

### Issue: Language doesn't persist after refresh
**Solution**: Ensure localStorage is enabled and the language preference is being saved.

### Issue: Date/Currency formatting incorrect
**Solution**: Use the provided formatting functions instead of native JavaScript methods.

### Issue: Backend not detecting language
**Solution**: Ensure the I18nMiddleware is applied to all routes.

## Future Enhancements

- [ ] Add support for more Ethiopian languages (Oromo, Tigrinya)
- [ ] Implement translation management system
- [ ] Add automatic translation fallbacks
- [ ] Implement context-aware translations
- [ ] Add support for RTL languages if needed
- [ ] Create translation validation tools

## Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Ethiopian Locale Standards](https://www.unicode.org/cldr/charts/latest/summary/am.html)

## Support

For questions or issues related to i18n implementation, contact:
- Frontend: Senior Mobile Developer
- Backend: Senior Backend Developer
- UX/Content: UX Designer