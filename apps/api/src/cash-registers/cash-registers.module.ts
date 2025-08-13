import { Module } from '@nestjs/common';
import { CashRegistersService } from './cash-registers.service';
import { CashRegistersController } from './cash-registers.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CashRegistersController],
  providers: [CashRegistersService, PrismaService],
})
export class CashRegistersModule {}

