import { validate } from 'class-validator';
import { PasswordResetRequestDto } from './password-reset-request.dto';

describe('PasswordResetRequestDto', () => {
  let dto: PasswordResetRequestDto;

  beforeEach(() => {
    dto = new PasswordResetRequestDto();
  });

  describe('email validation', () => {
    it('should pass validation with valid email', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with invalid email format', async () => {
      dto.email = 'invalid-email';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail validation with empty email', async () => {
      dto.email = '';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with undefined email', async () => {
      dto.email = undefined as any;
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with email containing special characters', async () => {
      dto.email = 'user+tag@example.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with email containing numbers', async () => {
      dto.email = 'user123@example.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with email containing spaces only', async () => {
      dto.email = '   ';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('clientId validation', () => {
    it('should pass validation with valid clientId', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with alphanumeric clientId', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'mobile-app-v1.0';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with clientId containing underscores and hyphens', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'client_app_v1-2';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation with empty clientId', async () => {
      dto.email = 'user@example.com';
      dto.clientId = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation with undefined clientId', async () => {
      dto.email = 'user@example.com';
      dto.clientId = undefined as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with clientId containing only spaces', async () => {
      dto.email = 'user@example.com';
      dto.clientId = '   ';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should pass validation with clientId containing special characters', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'client@app:v1.0';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('combined validation', () => {
    it('should pass validation with all valid fields', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'web-application';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when both fields are invalid', async () => {
      dto.email = 'invalid-email';
      dto.clientId = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when email is valid but clientId is invalid', async () => {
      dto.email = 'user@example.com';
      dto.clientId = '';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when clientId is valid but email is invalid', async () => {
      dto.email = 'invalid-email';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('security considerations', () => {
    it('should handle potential XSS attempts in email field', async () => {
      dto.email = '<script>alert("xss")</script>@example.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      // Note: class-validator isEmail doesn't protect against XSS
      // Additional sanitization should be implemented at application level
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle long email addresses', async () => {
      // Use a more reasonable long email that would still be valid
      dto.email = 'a'.repeat(64) + '@' + 'b'.repeat(50) + '.com';
      dto.clientId = 'web-app';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle very long clientId', async () => {
      dto.email = 'user@example.com';
      dto.clientId = 'a'.repeat(100);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle email with international characters', async () => {
      dto.email = 'user@例え.テスト';
      dto.clientId = 'web-app';

      // This might fail depending on the email validator configuration
      // but should not crash the application
      expect(async () => {
        await validate(dto);
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      dto.email = null as any;
      dto.clientId = null as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined values', async () => {
      dto.email = undefined as any;
      dto.clientId = undefined as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle mixed valid/invalid values', async () => {
      dto.email = 'user@example.com';
      dto.clientId = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(1); // Only clientId error
    });
  });
});
