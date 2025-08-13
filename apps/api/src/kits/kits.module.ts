import { Module } from '@nestjs/common';
import { KitsService } from './kits.service';
import { KitsController } from './kits.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [KitsController],
  providers: [KitsService, PrismaService],
})
export class KitsModule {}
