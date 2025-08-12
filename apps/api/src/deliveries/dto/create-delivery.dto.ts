import { DeliveryStatus } from '@prisma/client';

export class CreateDeliveryDto {
  quotationId!: string;
  status?: DeliveryStatus;
  assignedTo?: string;
  notes?: string;
}
