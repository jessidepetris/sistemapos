import { BackupsService } from './backups.service';
import { PrismaService } from '../prisma.service';

describe('BackupsService', () => {
  it('should be defined', () => {
    const service = new BackupsService(new PrismaService());
    expect(service).toBeDefined();
  });
});

