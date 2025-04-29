import { EscPos } from 'escpos-printer-toolkit';

export interface PrintTicketOptions {
  sale: any;
  items: any[];
  customer?: any;
  customerName?: string;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}

export const PrintService = {
  async printTicket({
    sale,
    items = [],
    customer,
    customerName,
    businessInfo = {
      name: 'PUNTO PASTELERO',
      address: 'Avenida Siempre Viva 123, Springfield',
      phone: '(555) 123-4567',
    }
  }: PrintTicketOptions): Promise<boolean> {
    try {
      // Crear una ventana de impresión con formato de ticket
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('No se pudo abrir la ventana de impresión');
        return false;
      }
      
      // Crear el contenido HTML del ticket
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ticket de Venta - ${businessInfo.name}</title>
            <style>
              @page { 
                size: 80mm auto; 
                margin: 0mm; 
              }
              body { 
                font-family: 'Courier New', monospace; 
                font-size: 12px;
                margin: 0;
                padding: 8px;
                width: 80mm;
              }
              .ticket-header { 
                text-align: center; 
                margin-bottom: 10px; 
              }
              .ticket-header h1 { 
                font-size: 16px; 
                margin: 0; 
              }
              .ticket-header p { 
                margin: 2px 0; 
                font-size: 12px; 
              }
              .ticket-info { 
                margin: 10px 0; 
              }
              .ticket-info p { 
                margin: 2px 0; 
              }
              .ticket-divider { 
                border-top: 1px dashed #000; 
                margin: 8px 0; 
              }
              .product-item { 
                margin-bottom: 5px; 
              }
              .product-name { 
                font-weight: bold; 
              }
              .product-total { 
                text-align: right; 
                margin-top: 10px; 
                font-weight: bold; 
              }
              .ticket-footer { 
                text-align: center; 
                margin-top: 10px; 
                font-size: 11px; 
              }
            </style>
          </head>
          <body>
            <div class="ticket-header">
              <h1>${businessInfo.name}</h1>
              <p>${businessInfo.address}</p>
              <p>${businessInfo.phone}</p>
              ${businessInfo.taxId ? `<p>CUIT: ${businessInfo.taxId}</p>` : ''}
            </div>
            
            <div class="ticket-divider"></div>
            
            <div class="ticket-info">
              <p><b>Fecha:</b> ${new Date(sale.timestamp).toLocaleString()}</p>
              <p><b>Ticket #:</b> ${sale.id || 'N/A'}</p>
              <p><b>Comprobante:</b> ${this.getDocumentTypeName(sale.documentType)}</p>
              <p><b>Cliente:</b> ${customerName || (customer?.name) || 'Consumidor Final'}</p>
              <p><b>Vendedor:</b> ${sale.userId || 'N/A'}</p>
            </div>
            
            <div class="ticket-divider"></div>
            
            <div class="ticket-items">
              <p><b>PRODUCTOS</b></p>
              ${items.map(item => `
                <div class="product-item">
                  <div class="product-name">${item.name}</div>
                  <div>${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}</div>
                  ${item.isConversion ? `<div style="font-size: 10px;">Presentación: ${item.unit} (Factor: ${item.conversionFactor})</div>` : ''}
                </div>
              `).join('')}
            </div>
            
            <div class="ticket-divider"></div>
            
            <div class="product-total">
              <p>Subtotal: $${parseFloat(sale.subtotal ?? sale.total ?? 0).toFixed(2)}</p>
              ${(parseFloat(sale.discountPercent) > 0) ? `<p>Descuento (${sale.discountPercent}%): -$${parseFloat(sale.discount ?? 0).toFixed(2)}</p>` : ''}
              ${(parseFloat(sale.surchargePercent) > 0) ? `<p>Recargo (${sale.surchargePercent}%): +$${parseFloat(sale.surcharge ?? 0).toFixed(2)}</p>` : ''}
              <p>TOTAL: $${parseFloat(sale.total).toFixed(2)}</p>
            </div>
            
            <div class="ticket-footer">
              <p>Gracias por su compra!</p>
              <p>Punto Pastelero</p>
            </div>
            
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // También genera un blob para descargar comandos ESC/POS como alternativa
      try {
        // Crear un objeto EscPos para comandos de impresora térmica
        const escpos = new EscPos();
        
        escpos
          .initialize()
          .align('center')
          .bold(true)
          .size(1, 1)
          .text(businessInfo.name)
          .bold(false)
          .size(0, 0)
          .text(businessInfo.address)
          .text(businessInfo.phone)
          .text('----------------------------------')
          .align('left')
          .text(`Fecha: ${new Date(sale.timestamp).toLocaleString()}`)
          .text(`Ticket #: ${sale.id || 'N/A'}`)
          .text(`Comprobante: ${this.getDocumentTypeName(sale.documentType)}`)
          .text(`Cliente: ${customerName || (customer?.name) || 'Consumidor Final'}`)
          .text(`Vendedor: ${sale.userId || 'N/A'}`)
          .text('----------------------------------')
          .text('PRODUCTOS')
          .text('----------------------------------');
        
        // Agregar productos
        items.forEach(item => {
          escpos
            .text(`${item.name}`)
            .text(`${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}`)
            .text('');
        });
        
        // Totales
        escpos
          .text('----------------------------------')
          .align('right')
          .text(`Subtotal: $${parseFloat(sale.subtotal ?? sale.total ?? 0).toFixed(2)}`)
          .text(parseFloat(sale.discountPercent) > 0 ? `Descuento (${sale.discountPercent}%): -$${parseFloat(sale.discount ?? 0).toFixed(2)}` : '')
          .text(parseFloat(sale.surchargePercent) > 0 ? `Recargo (${sale.surchargePercent}%): +$${parseFloat(sale.surcharge ?? 0).toFixed(2)}` : '')
          .text(`TOTAL: $${parseFloat(sale.total).toFixed(2)}`)
          .align('center')
          .text('')
          .text('Gracias por su compra!')
          .text('Punto Pastelero')
          .cut();
        
        // Obtener los comandos como un Blob
        const blob = new Blob([escpos.getBuffer()], { type: 'application/octet-stream' });
        localStorage.setItem('lastEscposTicket', URL.createObjectURL(blob));
      } catch (e) {
        console.warn('Error al generar comandos ESC/POS:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error al imprimir ticket:', error);
      return false;
    }
  },
  
  // Función para obtener el nombre amigable del tipo de documento
  getDocumentTypeName(type: string): string {
    switch (type) {
      case 'remito': return 'Remito';
      case 'factura_a': return 'Factura A';
      case 'factura_b': return 'Factura B';
      case 'factura_c': return 'Factura C';
      default: return type;
    }
  }
};