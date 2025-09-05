import { NextApiRequest, NextApiResponse } from 'next';

/**
 * CSP Violation Report Handler
 * Logs Content Security Policy violations for monitoring and debugging
 * Uses lightweight logging to avoid heavy dependencies in frontend
 */

/**
 * Lightweight logger for CSP violations
 * Implements structured logging without external dependencies
 */
class CSPLogger {
  private static formatMessage(
    level: string,
    message: string,
    meta?: Record<string, unknown>,
  ): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: 'csp-report',
      message,
      ...meta,
    };
    return JSON.stringify(logEntry);
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(this.formatMessage('info', message, meta));
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, meta));
  }

  static error(message: string, meta?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, meta));
  }
}

/**
 * Security utilities for sanitizing CSP report data
 */
class SecurityUtils {
  /**
   * Sanitize URI to prevent log injection and PII exposure
   */
  static sanitizeUri(uri?: string): string | undefined {
    if (!uri) return undefined;
    // Remove potential script injection and limit length
    return uri.replace(/[<>'"&]/g, '').substring(0, 500);
  }

  /**
   * Sanitize User-Agent string for logging
   */
  static sanitizeUserAgent(userAgent?: string): string | undefined {
    if (!userAgent) return undefined;
    // Remove potential sensitive information and limit length
    return userAgent.replace(/([?&].*)/g, '').substring(0, 200);
  }

  /**
   * Sanitize IP address for logging (mask last octet for privacy)
   */
  static sanitizeIp(ip?: string): string | undefined {
    if (!ip) return undefined;
    // Handle IPv4 addresses
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
      }
    }
    // Handle IPv6 or other formats - mask last segment
    return ip.replace(/[:.][^:.]*$/, ':***');
  }
}

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'status-code': number;
    'script-sample'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

/**
 * Safely extracts error information from an unknown error type
 */
function getErrorInfo(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj) {
      return {
        message: String(errorObj.message),
        stack: 'stack' in errorObj ? String(errorObj.stack) : undefined,
      };
    }
  }

  return { message: 'Unknown error occurred' };
}

// HTTP Status Code constants
const HTTP_METHOD_NOT_ALLOWED = 405;
const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const HTTP_INTERNAL_SERVER_ERROR = 500;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res
      .status(HTTP_METHOD_NOT_ALLOWED)
      .json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CSPViolationReport;

    // Validate CSP report structure
    if (!body['csp-report']) {
      CSPLogger.warn('Invalid CSP report received', {
        hasBody: Boolean(body),
        bodyType: typeof body,
      });
      return res
        .status(HTTP_BAD_REQUEST)
        .json({ error: 'Invalid CSP report format' });
    }

    const report = body['csp-report'];

    // Log the violation with structured data (sanitized for security)
    CSPLogger.warn('CSP Violation Detected', {
      documentUri: SecurityUtils.sanitizeUri(report['document-uri']),
      referrer: SecurityUtils.sanitizeUri(report['referrer']),
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: SecurityUtils.sanitizeUri(report['blocked-uri']),
      statusCode: report['status-code'],
      scriptSample: report['script-sample']?.substring(0, 200), // Truncate for security
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      userAgent: SecurityUtils.sanitizeUserAgent(req.headers['user-agent']),
      ip: SecurityUtils.sanitizeIp(
        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      ),
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to:
    // 1. Send to monitoring service (DataDog, New Relic, etc.)
    // 2. Store in database for analysis
    // 3. Send alerts for critical violations
    // 4. Aggregate reports for policy updates

    // For now, just acknowledge receipt
    res.status(HTTP_OK).json({
      status: 'received',
      message: 'CSP violation report logged successfully',
    });
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    CSPLogger.error('Error processing CSP report', {
      error: errorInfo.message,
      stack: errorInfo.stack,
      hasBody: Boolean(req.body),
    });

    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error processing CSP report',
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // CSP reports are typically small
    },
  },
};
