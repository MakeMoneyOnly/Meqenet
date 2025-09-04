import {
  Injectable,
  NestMiddleware,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Redis-backed Idempotency Middleware (shared across services)
const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const PENDING_RESPONSE_MARKER = 'pending';
const DEFAULT_SERVICE_NAME = 'payments-service';
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;
const LOCK_TTL_SECONDS = 10; // Short TTL for the lock
const HOURS_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;
const RESPONSE_TTL_SECONDS = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE; // 24 hours for the final response
const HTTP_STATUS_OK = 200;

// Configuration utility for shared middleware (cannot use DI)
/* eslint-disable internal/no-process-env-outside-config */
class IdempotencyConfig {
  static get serviceName(): string {
    return process.env.SERVICE_NAME || DEFAULT_SERVICE_NAME;
  }

  static get redisHost(): string {
    return process.env.REDIS_HOST || DEFAULT_REDIS_HOST;
  }

  static get redisPort(): number {
    const port = process.env.REDIS_PORT;
    return port ? parseInt(port, 10) : DEFAULT_REDIS_PORT;
  }

  static get redisPassword(): string | undefined {
    return process.env.REDIS_PASSWORD;
  }
}
/* eslint-enable internal/no-process-env-outside-config */

const SERVICE_NAMESPACE = IdempotencyConfig.serviceName;
const KEY_PREFIX = `idemp:${SERVICE_NAMESPACE}:`;

@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  private readonly logger = new Logger(IdempotencyMiddleware.name);
  private readonly redisClient: Redis;

  constructor() {
    this.redisClient = new Redis({
      host: IdempotencyConfig.redisHost,
      port: IdempotencyConfig.redisPort,
      password: IdempotencyConfig.redisPassword,
    });
  }

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
    const existingData = await this.redisClient.get(cacheKey);

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

    // 3. If no existing data, acquire a lock (atomic NX + EX)
    const lockResult = await this.redisClient.set(
      cacheKey,
      PENDING_RESPONSE_MARKER,
      'EX',
      LOCK_TTL_SECONDS,
      'NX'
    );

    if (lockResult !== 'OK') {
      throw new ConflictException(
        'A request with this idempotency key is already in progress.'
      );
    }

    // 4. Patch res.json and res.send to cache the real response when it's ready
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
      this.redisClient
        .set(
          cacheKey,
          JSON.stringify(responseToCache),
          'EX',
          RESPONSE_TTL_SECONDS
        )
        .catch(err =>
          this.logger.error('Failed to cache idempotent response', err)
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

    // 5. Proceed to the next middleware/handler
    next();
  }
}
