import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuditService } from './audit/audit.service';
import { AuditAction } from './audit/dto/create-audit-log.dto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
