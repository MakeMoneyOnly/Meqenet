import { Injectable, NestMiddleware, ConflictException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { RedisService } from '../shared/redis/redis.service';

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const PENDING_RESPONSE_MARKER = 'pending';
const LOCK_TTL_SECONDS = 10; // Short TTL for the lock
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const RESPONSE_TTL_SECONDS = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE; // 24 hours for the final response

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

    // 2. Check for an existing response or lock
    const existingData = await this.redisService.get(idempotencyKey);

    if (existingData) {
      // 2a. If it's a final response, return it
      if (existingData !== PENDING_RESPONSE_MARKER) {
        const parsedResponse = JSON.parse(existingData);
        res.status(parsedResponse.status).json(parsedResponse.body);
        return;
      }
      // 2b. If it's locked, throw a conflict error
      throw new ConflictException(
        'A request with this idempotency key is already in progress.'
      );
    }

    // 3. If no existing data, acquire a lock
    const lockAcquired = await this.redisService.set(
      idempotencyKey,
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
    const originalSend = res.send;
    res.send = (body: unknown): Response => {
      // Ensure body is a string before trying to parse
      const bodyAsString =
        typeof body === 'string' ? body : JSON.stringify(body);

      try {
        const responseToCache = {
          status: res.statusCode,
          body: JSON.parse(bodyAsString),
        };

        // Store the final response with a longer TTL
        this.redisService.set(
          idempotencyKey,
          JSON.stringify(responseToCache),
          RESPONSE_TTL_SECONDS
        );
      } catch {
        // If body is not valid JSON, cache it as is.
        this.redisService.set(
          idempotencyKey,
          bodyAsString,
          RESPONSE_TTL_SECONDS
        );
      }

      return originalSend.call(res, body);
    };

    // 5. If lock is acquired, proceed to the next middleware/handler
    next();
  }
}
