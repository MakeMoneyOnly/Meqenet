import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Idempotency middleware configuration constants
 * Enterprise FinTech compliant idempotency handling
 */
const IDEMPOTENCY_CONFIG = {
  CONFLICT_STATUS_CODE: 409,
} as const;

/**
 * Cache entry structure for idempotency tracking
 */
interface IdempotencyCacheEntry {
  isProcessing: boolean;
  responseBody: unknown;
  statusCode: number;
}

// Simple in-memory cache for demonstration purposes.
// In a production environment, this should be replaced with a distributed cache like Redis.
const idempotencyCache = new Map<string, IdempotencyCacheEntry>();

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      // If the key is missing, proceed without idempotency checks.
      // Alternatively, you could throw an error for endpoints that require it.
      return next();
    }

    const cached = idempotencyCache.get(idempotencyKey);

    if (cached) {
      if (cached.isProcessing) {
        this.logger.warn(
          `Request with key '${idempotencyKey}' is already being processed.`
        );
        return res
          .status(IDEMPOTENCY_CONFIG.CONFLICT_STATUS_CODE)
          .json({ message: 'Request in progress' });
      }
      this.logger.log(`Returning cached response for key '${idempotencyKey}'`);
      return res.status(cached.statusCode).json(cached.responseBody);
    }

    // Key is not in cache, so this is a new request.
    idempotencyCache.set(idempotencyKey, {
      isProcessing: true,
      responseBody: null,
      statusCode: 0,
    });
    this.logger.log(`Processing new request with key '${idempotencyKey}'`);

    const originalJson = res.json;
    const originalSend = res.send;

    res.json = (body: unknown): Response => {
      idempotencyCache.set(idempotencyKey, {
        isProcessing: false,
        responseBody: body,
        statusCode: res.statusCode,
      });
      return originalJson.call(res, body);
    };

    res.send = (body: unknown): Response => {
      idempotencyCache.set(idempotencyKey, {
        isProcessing: false,
        responseBody: body,
        statusCode: res.statusCode,
      });
      return originalSend.call(res, body);
    };

    next();
  }
}
