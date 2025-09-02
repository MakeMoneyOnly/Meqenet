import { z } from 'zod';

/**
 * Validation schemas for authentication endpoints
 * Following Ethiopian FinTech security requirements
 */

// Constants for validation
const FAYDA_ID_LENGTH = 16;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MIN_DEVICE_FINGERPRINT_LENGTH = 10;
const MAX_DEVICE_FINGERPRINT_LENGTH = 512;
const MAX_USER_AGENT_LENGTH = 512;
// IPv4 octet maximum value
const MAX_IPV4_OCTET = 255;
const MAX_DEVICE_ID_LENGTH = 128;
const TOKEN_MIN_LENGTH = 10;
const TOKEN_MAX_LENGTH = 2048;
const RESET_TOKEN_MIN_LENGTH = 32;

// Fayda National ID validation (16 digits)
export const faydaIdSchema = z
  .string()
  .regex(/^[0-9]{16}$/, 'Fayda ID must be exactly 16 digits')
  .refine(val => val.length === FAYDA_ID_LENGTH, 'Invalid Fayda ID format');

// Ethiopian phone number validation (+251 format)
export const phoneNumberSchema = z
  .string()
  .regex(/^\+251[0-9]{9}$/, 'Phone number must be in +251XXXXXXXXX format')
  .or(
    z.string().regex(/^0[0-9]{9}$/, 'Phone number must be in 0XXXXXXXXX format')
  );

// Email validation with Ethiopian domains preference
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(MAX_EMAIL_LENGTH, 'Email too long')
  .toLowerCase();

// Strong password validation for FinTech compliance
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, 'Password must be at least 8 characters')
  .max(MAX_PASSWORD_LENGTH, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

// Device fingerprint validation
export const deviceFingerprintSchema = z
  .string()
  .min(MIN_DEVICE_FINGERPRINT_LENGTH, 'Device fingerprint too short')
  .max(MAX_DEVICE_FINGERPRINT_LENGTH, 'Device fingerprint too long')
  .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid device fingerprint format');

// Request ID validation (UUID v4)
export const requestIdSchema = z
  .string()
  .uuid('Request ID must be a valid UUID');

// IP address validation - basic validation only
export const ipAddressSchema = z.string().refine(val => {
  // Safe validation patterns for IP addresses - no exponential backtracking
  const ipv4Pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  // Safe IPv6 pattern with length constraints to prevent ReDoS
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (ipv4Pattern.test(val)) {
    // Additional validation for IPv4 ranges
    return val.split('.').every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= MAX_IPV4_OCTET;
    });
  }

  return ipv6Pattern.test(val);
}, 'Invalid IP address format');

// User agent validation
export const userAgentSchema = z
  .string()
  .min(1, 'User agent required')
  .max(MAX_USER_AGENT_LENGTH, 'User agent too long')
  .regex(/^[A-Za-z0-9\s\-.();:,/]+$/, 'Invalid user agent format');

// Base request metadata schema
export const requestMetadataSchema = z.object({
  requestId: requestIdSchema,
  sessionId: z.string().uuid().optional(),
  deviceId: z.string().min(1).max(MAX_DEVICE_ID_LENGTH).optional(),
  ipAddress: ipAddressSchema.optional(),
  userAgent: userAgentSchema.optional(),
  correlationId: z.string().uuid().optional(),
});

// Authentication request schemas
export const authenticateUserSchema = z.object({
  faydaId: faydaIdSchema,
  password: passwordSchema,
  deviceFingerprint: deviceFingerprintSchema.optional(),
  metadata: requestMetadataSchema,
});

export const validateTokenSchema = z.object({
  accessToken: z
    .string()
    .min(TOKEN_MIN_LENGTH, 'Access token too short')
    .max(TOKEN_MAX_LENGTH, 'Access token too long'),
  metadata: requestMetadataSchema,
});

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(TOKEN_MIN_LENGTH, 'Refresh token too short')
    .max(TOKEN_MAX_LENGTH, 'Refresh token too long'),
  metadata: requestMetadataSchema,
});

export const logoutUserSchema = z.object({
  accessToken: z
    .string()
    .min(TOKEN_MIN_LENGTH, 'Access token too short')
    .max(TOKEN_MAX_LENGTH, 'Access token too long'),
  metadata: requestMetadataSchema,
});

// User registration schema (for future use)
export const registerUserSchema = z
  .object({
    faydaId: faydaIdSchema,
    email: emailSchema,
    phoneNumber: phoneNumberSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true).refine(val => val === true, {
      message: 'Must agree to terms and conditions',
    }),
    metadata: requestMetadataSchema,
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Password reset schemas
export const requestPasswordResetSchema = z.object({
  faydaId: faydaIdSchema,
  metadata: requestMetadataSchema,
});

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(RESET_TOKEN_MIN_LENGTH, 'Reset token invalid'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
    metadata: requestMetadataSchema,
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// MFA schemas
export const setupMfaSchema = z.object({
  userId: z.string().uuid(),
  method: z.enum(['sms', 'email', 'totp']),
  phoneNumber: phoneNumberSchema.optional(),
  email: emailSchema.optional(),
  metadata: requestMetadataSchema,
});

export const verifyMfaSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().regex(/^[0-9]{6}$/, 'MFA code must be 6 digits'),
  method: z.enum(['sms', 'email', 'totp']),
  metadata: requestMetadataSchema,
});

// Type exports for use in controllers/services
export type AuthenticateUserDto = z.infer<typeof authenticateUserSchema>;
export type ValidateTokenDto = z.infer<typeof validateTokenSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type LogoutUserDto = z.infer<typeof logoutUserSchema>;
export type RegisterUserDto = z.infer<typeof registerUserSchema>;
export type RequestPasswordResetDto = z.infer<
  typeof requestPasswordResetSchema
>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type SetupMfaDto = z.infer<typeof setupMfaSchema>;
export type VerifyMfaDto = z.infer<typeof verifyMfaSchema>;
export type RequestMetadataDto = z.infer<typeof requestMetadataSchema>;
