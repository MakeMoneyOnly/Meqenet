# Bilingual Error Handling Documentation

## Overview

The Auth Service implements bilingual error handling to comply with Ethiopian National Bank (NBE)
consumer protection directives. All error messages are provided in both English and Amharic (አማርኛ).

## Implementation

### 1. Error Messages Module

Location: `src/shared/i18n/error-messages.ts`

This module contains all error messages in both languages, organized by category:

- **AUTH**: Authentication-related errors
- **VALIDATION**: Input validation errors
- **SECURITY**: Security and permission errors
- **SYSTEM**: System and infrastructure errors
- **COMPLIANCE**: Compliance-related errors

### 2. Global Exception Filter

Location: `src/shared/filters/global-exception.filter.ts`

The filter:

- Intercepts all exceptions
- Determines user's language preference from `Accept-Language` header
- Returns standardized bilingual error responses
- Logs security-relevant errors for audit compliance
- Includes unique request IDs for NBE tracking

### 3. DTO Validation Messages

All DTOs include bilingual validation messages:

```typescript
@IsEmail({}, {
  message: JSON.stringify({
    en: 'Please provide a valid email address.',
    am: 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያቅርቡ።'
  })
})
```

## Usage

### Setting Language Preference

Clients can specify their preferred language using the `Accept-Language` header:

```http
Accept-Language: en    # English (default)
Accept-Language: am    # Amharic
```

### Error Response Format

All error responses follow this standardized format:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/auth/login",
  "method": "POST",
  "requestId": "req_1234567890_abcdef12",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": {
      "en": "Invalid email or password. Please check and try again.",
      "am": "ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል። እባክዎ ይመልከቱና እንደገና ይሞክሩ።"
    },
    "category": "AUTH"
  }
}
```

### Adding New Error Messages

1. Add the error to `AuthErrorMessages` in `error-messages.ts`:

```typescript
NEW_ERROR: {
  en: 'English error message',
  am: 'አማርኛ የስህተት መልእክት',
  code: 'ERR_NEW_ERROR',
  category: 'AUTH',
}
```

2. Use in service layer:

```typescript
throw new BadRequestException({
  errorCode: 'NEW_ERROR',
  message: 'Fallback message',
});
```

## API Examples

### Registration with Validation Error

Request:

```http
POST /auth/register
Accept-Language: am
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "short"
}
```

Response:

```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/auth/register",
  "method": "POST",
  "requestId": "req_1234567890_abcdef12",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": {
      "en": "Please provide a valid email address.",
      "am": "እባክዎ ትክክለኛ የኢሜይል አድራሻ ያቅርቡ።"
    },
    "category": "VALIDATION"
  }
}
```

### Login with Invalid Credentials

Request:

```http
POST /auth/login
Accept-Language: en
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "wrong-password"
}
```

Response:

```json
{
  "statusCode": 401,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "path": "/auth/login",
  "method": "POST",
  "requestId": "req_1234567890_abcdef12",
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": {
      "en": "Invalid email or password. Please check and try again.",
      "am": "ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል። እባክዎ ይመልከቱና እንደገና ይሞክሩ።"
    },
    "category": "AUTH"
  }
}
```

## Testing

### Unit Tests

Test bilingual messages in service tests:

```typescript
it('should return bilingual error for invalid credentials', async () => {
  try {
    await service.login({ email: 'test@test.com', password: 'wrong' });
  } catch (error) {
    expect(error.response.errorCode).toBe('INVALID_CREDENTIALS');
  }
});
```

### E2E Tests

Test language preference in E2E tests:

```typescript
it('should return Amharic error message when Accept-Language is am', () => {
  return request(app.getHttpServer())
    .post('/auth/login')
    .set('Accept-Language', 'am')
    .send({ email: 'wrong@test.com', password: 'wrong' })
    .expect(401)
    .expect(res => {
      expect(res.body.error.message.am).toBeDefined();
    });
});
```

## Compliance

This implementation ensures compliance with:

1. **NBE Directive No. FIS/02/2021**: Requires financial services to provide information in local
   languages
2. **Consumer Protection**: All error messages are clear and understandable in both languages
3. **Audit Trail**: All errors include unique request IDs for tracking and compliance reporting

## Best Practices

1. **Always provide both languages**: Never omit either language in error messages
2. **Keep messages consistent**: Use the same terminology across all errors
3. **Be user-friendly**: Avoid technical jargon in error messages
4. **Include actionable information**: Tell users how to resolve the error
5. **Log appropriately**: Ensure security-relevant errors are logged for audit

## Language Support Expansion

To add support for additional Ethiopian languages (Oromo, Tigrinya, etc.):

1. Extend the `BilingualErrorMessage` interface
2. Add language detection logic to the exception filter
3. Update all error messages with translations
4. Update DTOs with new language validations

## Support

For questions or issues with bilingual error handling:

- Contact the development team
- Review the error messages module
- Check the NBE compliance documentation
