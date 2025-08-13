import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Histogram, register } from 'prom-client';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly httpHistogram: Histogram<string>;

  constructor() {
    this.httpHistogram = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP latency',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    });
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const end = this.httpHistogram.startTimer({
      method: req.method,
      route: req.route?.path || req.url,
    });
    return next.handle().pipe(
      tap(() => end({ status: res.statusCode })),
      catchError((err) => {
        end({ status: res.statusCode || 500 });
        throw err;
      }),
    );
  }
}

export const metricsRegister = register;
