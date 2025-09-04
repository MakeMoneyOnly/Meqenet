import { Injectable, NestMiddleware, ConflictException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { RedisService } from '../shared/redis/redis.service';

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const PENDING_RESPONSE_MARKER = 'pending';
const KEY_PREFIX = 'idemp:api-gateway:';
const LOCK_TTL_SECONDS = 10; // Short TTL for the lock
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const RESPONSE_TTL_SECONDS = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE; // 24 hours for the final response
const HTTP_STATUS_OK = 200;

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const idempotencyKey = req.headers[
      IDEMPOTENCY_KEY_HEADER.toLowerCase()
    ] as string;

    // 1. If no idempotency key, skip middleware
    if (!idempotencyKey) {
      return next();
    }

    // Namespace key with method and url to avoid collisions across endpoints
    const cacheKey = `${KEY_PREFIX}${req.method}:${req.originalUrl}:${idempotencyKey}`;

    // 2. Check for an existing response or lock
    const existingData = await this.redisService.get(cacheKey);

    if (existingData) {
      // 2a. If it's a final response, return it
      if (existingData !== PENDING_RESPONSE_MARKER) {
        try {
          const parsedResponse = JSON.parse(existingData);
          res.status(parsedResponse.status).json(parsedResponse.body);
        } catch {
          // Legacy fallback: if cached data wasn't wrapped, send as-is
          res.status(HTTP_STATUS_OK).send(existingData);
        }
        return;
      }
      // 2b. If it's locked, throw a conflict error
      throw new ConflictException(
        'A request with this idempotency key is already in progress.'
      );
    }

    // 3. If no existing data, acquire a lock
    const lockAcquired = await this.redisService.set(
      cacheKey,
      PENDING_RESPONSE_MARKER,
      LOCK_TTL_SECONDS,
      'NX' // Only set if the key does not exist
    );

    if (!lockAcquired) {
      // This is a fallback for a race condition where another process sets the key
      // between the GET and SET operations.
      throw new ConflictException(
        'A request with this idempotency key is already in progress.'
      );
    }

    // 4. Monkey-patch res.send to cache the real response when it's ready
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    let cached = false;
    const cacheFinal = (bodyObj: unknown): void => {
      if (cached) return;
      cached = true;
      const responseToCache = {
        status: res.statusCode,
        body: bodyObj,
      };
      this.redisService.set(
        cacheKey,
        JSON.stringify(responseToCache),
        RESPONSE_TTL_SECONDS
      );
    };

    res.json = ((body: unknown): Response => {
      cacheFinal(body);
      return originalJson(body);
    }) as typeof res.json;

    res.send = ((body: unknown): Response => {
      const bodyAsString =
        typeof body === 'string' ? body : JSON.stringify(body);
      let parsed: unknown = bodyAsString;
      try {
        parsed = JSON.parse(bodyAsString);
      } catch {
        // keep as string
      }
      cacheFinal(parsed);
      return originalSend(body as string);
    }) as typeof res.send;

    // 5. If lock is acquired, proceed to the next middleware/handler
    next();
  }
}
