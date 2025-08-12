import { Module } from '@nestjs/common';
import { ReportsKardexService } from './reports-kardex.service';
import { ReportsKardexController } from './reports-kardex.controller';

@Module({
  providers: [ReportsKardexService],
  controllers: [ReportsKardexController],
})
export class ReportsKardexModule {}
