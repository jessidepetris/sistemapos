import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuditService } from './audit/audit.service';
import { AuditAction } from './audit/dto/create-audit-log.dto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import crypto from 'crypto';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });

  const app = await NestFactory.create(AppModule, { logger: false });

  const logger = pino({
    level: process.env.API_LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  });
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers['x-request-id'] as string) || crypto.randomUUID(),
      customLogLevel: (res, err) => (err || res.statusCode >= 500 ? 'error' : 'info'),
    }),
  );

  app.use(helmet());
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
  });
  app.use('/auth', limiter);
  app.use('/payments/webhooks', limiter);
  app.use('/afip', limiter);

  const allowed = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.use((req, _res, next) => {
    Sentry.getCurrentHub().configureScope((scope) => {
      if ((req as any).user) {
        const user: any = (req as any).user;
        scope.setUser({ id: user.id, email: user.email });
      }
    });
    next();
  });
  process.on('unhandledRejection', (r) => Sentry.captureException(r as any));
  process.on('uncaughtException', (err) => {
    Sentry.captureException(err);
    throw err;
  });

  const metricsInterceptor = app.get(MetricsInterceptor);
  app.useGlobalInterceptors(metricsInterceptor);

  const audit = app.get(AuditService);
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const actionMap: Record<string, AuditAction> = {
        POST: AuditAction.CREATE,
        PUT: AuditAction.UPDATE,
        PATCH: AuditAction.UPDATE,
        DELETE: AuditAction.DELETE,
      };
      const action = actionMap[req.method];
      if (!action) return;
      const duration = Date.now() - start;
      const user: any = (req as any).user || {};
      audit
        .log({
          userId: user.id,
          userEmail: user.email,
          action,
          route: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          ip: (req.headers['x-forwarded-for'] as string) || req.ip,
          userAgent: req.headers['user-agent'] as string,
          meta: { durationMs: duration },
        })
        .catch(() => undefined);
    });
    next();
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
