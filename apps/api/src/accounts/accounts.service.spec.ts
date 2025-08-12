import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma.service';

describe('AccountsService', () => {
  it('should be defined', () => {
    const service = new AccountsService(new PrismaService());
    expect(service).toBeDefined();
  });
});
