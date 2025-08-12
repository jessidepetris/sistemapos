import { Module, CacheModule } from '@nestjs/common';
import { KpisService } from './kpis.service';
import { KpisController } from './kpis.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [CacheModule.register({ ttl: 300 })],
  controllers: [KpisController],
  providers: [KpisService, PrismaService],
})
export class KpisModule {}
