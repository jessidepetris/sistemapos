import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CashRegistersService {
  constructor(private prisma: PrismaService) {}

  create(data: Prisma.CashRegisterCreateInput) {
    return this.prisma.cashRegister.create({ data });
  }

  findAll() {
    return this.prisma.cashRegister.findMany({});
  }

  update(id: string, data: Prisma.CashRegisterUpdateInput) {
    return this.prisma.cashRegister.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.cashRegister.delete({ where: { id } });
  }
}

