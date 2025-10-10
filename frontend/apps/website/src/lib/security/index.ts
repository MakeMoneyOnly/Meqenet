/**
 * Security Utilities for FinTech Application
 * Implements security measures as outlined in Security.md
 */

import crypto from 'crypto';
import validator from 'validator';
const z = require('zod');

/**
 * Logger utility for Meqenet frontend
 * Handles different log levels and environment-specific behavior
 * Implements secure logging for financial applications
 */
export class Logger {
  private static readonly isDevelopment =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  private static readonly isProduction =
    typeof process !== 'undefined' && process.env.NODE_ENV === 'production';

  /**
   * Safe console log wrapper for development
   */
  private static safeLog(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    data?: Record<string, unknown>,
  ): void {
    if (typeof window !== 'undefined' && window.console) {
      const logData = data ? { message, ...data } : message;
      // Safe console access - level is from controlled enum
      const logFn =
        level === 'info'
          ? console.info
          : level === 'warn'
            ? console.warn
            : level === 'error'
              ? console.error
              : console.debug;
      logFn(logData);
    }
  }

  static info(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.safeLog('info', message, { args });
    }
  }

  static warn(message: string, ...args: unknown[]): void {
    this.safeLog('warn', message, { args: args });
  }

  static error(message: string, ...args: unknown[]): void {
    this.safeLog('error', message, { args: args });
  }

  static debug(message: string, ...args: unknown[]): void {
    if (this.isDevelopment) {
      this.safeLog('debug', message, { args });
    }
  }

  static security(
    level: 'AUDIT' | 'SECURITY',
    message: string,
    data?: Record<string, unknown>,
  ): void {
    // In production, this should integrate with observability platform
    // For now, log securely without exposing sensitive data
    if (this.isProduction) {
      this.safeLog('info', `[${level}] ${message}`, data);
      return;
    }

    this.safeLog('info', `SECURITY:${level} ${message}`, data);
  }

  /**
   * Log audit events for financial transactions
   */
  static audit(message: string, data: Record<string, unknown>): void {
    this.security('AUDIT', message, data);
  }
}

// Security constants
export const SECURITY_CONSTANTS = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_MAX_LENGTH: 128,
  TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  HASH_ROUNDS: 12,
} as const;

// Input validation schemas for financial data
export const FinancialSchemas = {
  amount: z.number().positive().max(1000000), // Max 1M ETB
  phoneNumber: z.string().regex(/^(\+251|0)[79]\d{8}$/), // Ethiopian phone format
  email: z.string().email().max(254),
  nationalId: z.string().min(10).max(20), // Ethiopian ID formats
  password: z
    .string()
    .min(SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH)
    .max(SECURITY_CONSTANTS.PASSWORD_MAX_LENGTH)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character',
    ),
};

/**
 * Secure input sanitization for financial data
 */
export class InputSanitizer {
  /**
   * Sanitize and validate financial amount
   */
  static sanitizeAmount(input: unknown): number {
    if (typeof input === 'string') {
      // Remove currency symbols and whitespace
      const cleaned = input.replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleaned);
      return FinancialSchemas.amount.parse(parsed);
    }
    return FinancialSchemas.amount.parse(input);
  }

  /**
   * Sanitize phone number for Ethiopian format
   */
  static sanitizePhoneNumber(input: string): string {
    const cleaned = input.replace(/\s+/g, '').trim();
    return FinancialSchemas.phoneNumber.parse(cleaned);
  }

  /**
   * Sanitize and validate email
   */
  static sanitizeEmail(input: string): string {
    const cleaned = validator.normalizeEmail(input.trim().toLowerCase()) || '';
    return FinancialSchemas.email.parse(cleaned);
  }

  /**
   * Sanitize text input to prevent XSS
   */
  static sanitizeText(input: string): string {
    return validator.escape(input.trim());
  }
}

/**
 * Cryptographic utilities for financial data protection
 */
export class CryptoUtils {
  private static readonly ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

  /**
   * Encrypt sensitive financial data
   */
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv(
      SECURITY_CONSTANTS.ENCRYPTION_ALGORITHM,
      key,
      iv,
    );
    cipher.setAAD(Buffer.from('financial-data', 'utf8'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  /**
   * Decrypt sensitive financial data
   */
  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv(
      SECURITY_CONSTANTS.ENCRYPTION_ALGORITHM,
      key,
      iv,
    );

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    decipher.setAAD(Buffer.from('financial-data', 'utf8'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, SECURITY_CONSTANTS.HASH_ROUNDS);
  }

  /**
   * Verify password hash
   */
  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }
}

/**
 * Rate limiting and fraud detection utilities
 */
export class SecurityMonitor {
  private static attempts = new Map<
    string,
    { count: number; lastAttempt: number }
  >();

  /**
   * Check if IP/user is rate limited
   */
  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if lockout period has passed
    if (now - record.lastAttempt > SECURITY_CONSTANTS.LOCKOUT_DURATION) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Check if max attempts exceeded
    if (record.count >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
      return true;
    }

    // Increment attempt count
    record.count++;
    record.lastAttempt = now;
    return false;
  }

  /**
   * Reset rate limit for identifier
   */
  static resetRateLimit(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Detect suspicious transaction patterns
   */
  static detectSuspiciousActivity(
    transactions: Array<{
      amount: number;
      timestamp: number;
      userId: string;
    }>,
  ): boolean {
    // Check for rapid successive transactions
    const recentTransactions = transactions.filter(
      (t) => Date.now() - t.timestamp < 5 * 60 * 1000, // Last 5 minutes
    );

    if (recentTransactions.length > 5) {
      return true;
    }

    // Check for unusually large amounts
    const totalAmount = recentTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );
    if (totalAmount > 50000) {
      // 50,000 ETB threshold
      return true;
    }

    return false;
  }
}

/**
 * Session management utilities
 */
export class SessionManager {
  /**
   * Generate secure session token
   */
  static generateSessionToken(): string {
    return CryptoUtils.generateSecureToken(64);
  }

  /**
   * Validate session token format
   */
  static isValidSessionToken(token: string): boolean {
    return /^[a-f0-9]{128}$/.test(token);
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(timestamp: number): boolean {
    return Date.now() - timestamp > SECURITY_CONSTANTS.SESSION_TIMEOUT;
  }
}

/**
 * Audit logging utilities for compliance
 */
export class AuditLogger {
  /**
   * Log financial transaction for audit trail
   */
  static logTransaction(data: {
    userId: string;
    transactionId: string;
    amount: number;
    type: string;
    timestamp: number;
    ipAddress: string;
    userAgent: string;
  }): void {
    // In production, this would write to a secure audit log
    const auditEntry = {
      ...data,
      level: 'AUDIT',
      category: 'FINANCIAL_TRANSACTION',
      timestamp: new Date().toISOString(),
    };

    // Security: Never log sensitive data in plain text
    Logger.audit('Financial transaction recorded', auditEntry);
  }

  /**
   * Log security event
   */
  static logSecurityEvent(event: {
    type:
      | 'LOGIN_ATTEMPT'
      | 'FAILED_LOGIN'
      | 'SUSPICIOUS_ACTIVITY'
      | 'DATA_ACCESS';
    userId?: string;
    ipAddress: string;
    userAgent: string;
    details: Record<string, unknown>;
  }): void {
    const auditEntry = {
      ...event,
      level: 'SECURITY',
      timestamp: new Date().toISOString(),
    };

    Logger.security('SECURITY', `Security event: ${event.type}`, auditEntry);
  }
}

// Export all utilities
const SecurityUtils = {
  InputSanitizer,
  CryptoUtils,
  SecurityMonitor,
  SessionManager,
  AuditLogger,
  FinancialSchemas,
  SECURITY_CONSTANTS,
  Logger,
};

export default SecurityUtils;
