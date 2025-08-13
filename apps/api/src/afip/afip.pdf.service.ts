import { Injectable } from '@nestjs/common';

@Injectable()
export class AfipPdfService {
  async generate(invoiceId: string) {
    // Placeholder: generate PDF and return URL
    return `/invoices/${invoiceId}.pdf`;
  }
}
