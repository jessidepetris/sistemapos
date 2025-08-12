import { Module } from '@nestjs/common';
import { PackVariantsService } from './pack-variants.service';
import { PackVariantsController } from './pack-variants.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PackVariantsController],
  providers: [PackVariantsService, PrismaService],
})
export class PackVariantsModule {}
