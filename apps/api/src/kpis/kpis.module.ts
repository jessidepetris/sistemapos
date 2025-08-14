import { Module } from '@nestjs/common';
import { KpisService } from './kpis.service';
import { KpisController } from './kpis.controller';
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache/cache.service';

@Module({
  controllers: [KpisController],
  providers: [KpisService, PrismaService, CacheService],
})
export class KpisModule {}
