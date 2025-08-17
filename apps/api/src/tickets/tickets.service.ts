import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async generateHtml(saleId: string): Promise<string> {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    const date = new Date(sale.createdAt);
    const itemsHtml = sale.items
      .map((item) => {
        const unit = Number(item.price);
        const lineTotal =
          Number(unit) * Number(item.quantity) - Number(item.discount ?? 0);
        const discountLine = Number(item.discount) > 0
          ? `<tr><td colspan="4" class="discount">Desc: -$${Number(item.discount).toFixed(2)}</td></tr>`
          : '';
        return `
<tr>
  <td>${item.product?.name || ''}</td>
  <td class="qty">${item.quantity}</td>
  <td class="price">$${unit.toFixed(2)}</td>
  <td class="total">$${lineTotal.toFixed(2)}</td>
</tr>${discountLine}`;
      })
      .join('');
    const subtotal = Number(sale.subtotal);
    const globalDiscount = Number(sale.discount);
    const total = Number(sale.total);
    const discountRow = globalDiscount
      ? `<tr><td>Descuento</td><td class="total">-$${globalDiscount.toFixed(2)}</td></tr>`
      : '';
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Ticket</title>
<style>
  @media print { @page { size: 58mm auto; margin: 0; } }
  body { width: 58mm; font-family: monospace; margin: 0; padding: 0; }
  .center { text-align: center; }
  table { width: 100%; border-collapse: collapse; }
  td { font-size: 12px; }
  .qty, .price, .total { text-align: right; }
  .discount { font-size: 10px; }
</style>
</head>
<body>
<div class="center"><strong>Punto Pastelero</strong></div>
<div>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
<div>Comprobante: ${sale.type === 'FACTURA_C' ? 'Factura C' : 'Remito X'}</div>
<div>Cliente: ${sale.customerName}</div>
<hr />
<table>
${itemsHtml}
</table>
<hr />
<table>
<tr><td>Subtotal</td><td class="total">$${subtotal.toFixed(2)}</td></tr>
${discountRow}
<tr><td>Total</td><td class="total">$${total.toFixed(2)}</td></tr>
<tr><td>Pagos</td><td class="total">${sale.payments
  .map(p => `${p.methodLabel || p.gateway}: $${Number(p.amount).toFixed(2)}`)
  .join('<br/>')}</td></tr>
</table>
<div class="center">¡Gracias por su compra!</div>
<script>window.onload = function() { window.print(); };</script>
</body>
</html>`;
    return html;
  }
}

