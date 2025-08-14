import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService {
  constructor(private prisma: PrismaService) {}

  private hash(body: any) {
    return crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }

  async get(key: string, endpoint: string, body: any) {
    const record = await this.prisma.idempotencyKey.findUnique({ where: { key } });
    if (record && record.endpoint === endpoint && record.bodyHash === this.hash(body)) {
      return record.response as any;
    }
    return null;
  }

  async save(key: string, endpoint: string, body: any, response: any) {
    await this.prisma.idempotencyKey.create({
      data: {
        key,
        endpoint,
        bodyHash: this.hash(body),
        response,
      },
    });
  }
}
