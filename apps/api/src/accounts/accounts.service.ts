import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async getClientAccount(clientId: number) {
    const movements = await this.prisma.accountMovement.findMany({
      where: { clientId },
      orderBy: { createdAt: 'asc' },
    });
    const balance = movements.reduce(
      (acc, m) => acc + (m.type === 'CARGO' ? Number(m.amount) : -Number(m.amount)),
      0,
    );
    return { movements, balance };
  }

  recordPayment(clientId: number, amount: number, description: string) {
    return this.prisma.accountMovement.create({
      data: { clientId, amount, description, type: 'PAGO' },
    });
  }

  async generatePdf(clientId: number): Promise<Buffer> {
    const { movements, balance } = await this.getClientAccount(clientId);
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk as Buffer));
    return new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(16).text(`Cuenta Corriente Cliente ${clientId}`);
      doc.moveDown();
      movements.forEach(m => {
        doc.text(`${m.createdAt.toISOString().slice(0,10)} - ${m.type} - $${m.amount} - ${m.description}`);
      });
      doc.moveDown();
      doc.text(`Saldo: $${balance}`);
      doc.end();
    });
  }
}
