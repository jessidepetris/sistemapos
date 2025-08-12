import { Controller, Get } from '@nestjs/common';
import { AlertsService, Alert } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  getAlerts(): Promise<Alert[]> {
    return this.alertsService.getAlerts();
  }
}

