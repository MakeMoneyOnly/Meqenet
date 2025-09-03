import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Histogram, Counter } from 'prom-client';

const buckets = [0.1, 0.25, 0.5, 1, 2, 5, 10];

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
        const durationSeconds = Number(end - start) / 1_000_000_000;
        const statusCode = res.statusCode || 0;
        getHistogram().labels(method, route, String(statusCode)).observe(durationSeconds);
        getCounter().labels(method, route, String(statusCode)).inc();
      })
    );
  }
}