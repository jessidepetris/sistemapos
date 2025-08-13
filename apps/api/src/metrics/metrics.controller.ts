import { Controller, Get, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { metricsRegister } from './metrics.interceptor';

@Controller('metrics')
export class MetricsController {
  @Get()
  async getMetrics(@Headers('authorization') auth: string | undefined, @Res() res: Response) {
    const token = process.env.METRICS_TOKEN;
    if (token && auth !== `Bearer ${token}`) {
      return res.status(401).send('Unauthorized');
    }
    res.setHeader('Content-Type', metricsRegister.contentType);
    res.send(await metricsRegister.metrics());
  }
}
