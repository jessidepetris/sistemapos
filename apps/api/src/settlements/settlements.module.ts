import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { PrismaService } from '../prisma.service';
import { MpSettlementService } from './mp-settlement.service';
import { GetnetSettlementService } from './getnet-settlement.service';

@Module({
  controllers: [SettlementsController],
  providers: [SettlementsService, MpSettlementService, GetnetSettlementService, PrismaService],
})
export class SettlementsModule {}
