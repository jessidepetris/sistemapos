import { Module } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsController } from './metrics.controller';

@Module({
  providers: [MetricsInterceptor],
  controllers: [MetricsController],
  exports: [MetricsInterceptor],
})
export class MetricsModule {}
