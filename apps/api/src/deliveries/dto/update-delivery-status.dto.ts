import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryStatusDto {
  status!: DeliveryStatus;
}
