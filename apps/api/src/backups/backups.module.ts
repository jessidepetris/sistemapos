import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { BackupsController } from './backups.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [BackupsController],
  providers: [BackupsService, PrismaService],
})
export class BackupsModule {}

