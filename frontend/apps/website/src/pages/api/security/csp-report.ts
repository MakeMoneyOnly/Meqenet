import { NextApiRequest, NextApiResponse } from 'next';
import winston from 'winston';

/**
 * CSP Violation Report Handler
 * Logs Content Security Policy violations for monitoring and debugging
 */

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'csp-report' },
  transports: [
    new winston.transports.File({
      filename: 'logs/csp-violations.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer': string;
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
  res: NextApiResponse
): Promise<void> {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(HTTP_METHOD_NOT_ALLOWED).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body as CSPViolationReport;

    // Validate CSP report structure
    if (!body['csp-report']) {
      logger.warn('Invalid CSP report received', { body });
      return res.status(HTTP_BAD_REQUEST).json({ error: 'Invalid CSP report format' });
    }

    const report = body['csp-report'];

    // Log the violation with structured data
    logger.warn('CSP Violation Detected', {
      documentUri: report['document-uri'],
      referrer: report['referrer'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      statusCode: report['status-code'],
      scriptSample: report['script-sample']?.substring(0, HTTP_OK), // Truncate for security
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
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
      message: 'CSP violation report logged successfully'
    });

  } catch (error) {
    const errorInfo = getErrorInfo(error);
    logger.error('Error processing CSP report', {
      error: errorInfo.message,
      stack: errorInfo.stack,
      body: req.body,
    });

    res.status(HTTP_INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error processing CSP report'
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
