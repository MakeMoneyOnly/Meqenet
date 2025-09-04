import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Histogram, Counter } from 'prom-client';

// Latency histogram bucket constants (seconds)
const LATENCY_BUCKET_100MS = 0.1;
const LATENCY_BUCKET_250MS = 0.25;
const LATENCY_BUCKET_500MS = 0.5;
const LATENCY_BUCKET_1S = 1;
const LATENCY_BUCKET_2S = 2;
const LATENCY_BUCKET_5S = 5;
const LATENCY_BUCKET_10S = 10;
const NANOSECONDS_PER_SECOND = 1_000_000_000;

const buckets = [
  LATENCY_BUCKET_100MS,
  LATENCY_BUCKET_250MS,
  LATENCY_BUCKET_500MS,
  LATENCY_BUCKET_1S,
  LATENCY_BUCKET_2S,
  LATENCY_BUCKET_5S,
  LATENCY_BUCKET_10S,
];

let httpLatencyHistogram: Histogram<string> | undefined;
let httpRequestsCounter: Counter<string> | undefined;

function getHistogram(): Histogram<string> {
  if (!httpLatencyHistogram) {
    httpLatencyHistogram = new Histogram({
      name: 'meqenet_http_server_request_duration_seconds',
      help: 'HTTP server request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets,
    });
  }
  return httpLatencyHistogram;
}

function getCounter(): Counter<string> {
  if (!httpRequestsCounter) {
    httpRequestsCounter = new Counter({
      name: 'meqenet_http_server_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });
  }
  return httpRequestsCounter;
}

@Injectable()
export class LatencyMetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const method: string = req.method;
    const route: string = req.route?.path || req.url || 'unknown';
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap(() => {
        const end = process.hrtime.bigint();
        const durationSeconds = Number(end - start) / NANOSECONDS_PER_SECOND;
        const statusCode = res.statusCode || 0;
        getHistogram()
          .labels(method, route, String(statusCode))
          .observe(durationSeconds);
        getCounter().labels(method, route, String(statusCode)).inc();
      })
    );
  }
}
