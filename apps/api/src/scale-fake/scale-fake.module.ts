import { Module } from '@nestjs/common';
import { ScaleFakeService } from './scale-fake.service';
import { ScaleFakeController } from './scale-fake.controller';
import { PrismaService } from '../prisma.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [ScaleFakeService, PrismaService],
  controllers: [ScaleFakeController],
})
export class ScaleFakeModule {}
