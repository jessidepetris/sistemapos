import { useState } from 'react';
import { EscPos } from 'escpos-printer-toolkit';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';

interface ThermalTicketProps {
  sale: any;
  saleItems?: any[];
  items?: any[];
  customerName?: string;
  customer?: any;
  businessInfo?: {
    name: string;
    address: string;
    phone: string;
    taxId?: string;
  };
}

export function ThermalTicket({ 
  sale, 
  saleItems, 
  items = [],
  customerName, 
  customer,
  businessInfo = {
    name: 'PUNTO PASTELERO',
    address: 'Avenida Siempre Viva 123, Springfield',
    phone: '(555) 123-4567',
  }
}: ThermalTicketProps) {
  // Utilizar saleItems si están definidos, o items como alternativa
  const products = saleItems || items;
  const [isPrinting, setIsPrinting] = useState(false);

  const printTicket = async () => {
    try {
      setIsPrinting(true);

      // Crear una ventana de impresión con formato de ticket
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
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
                <p><b>Comprobante:</b> ${getDocumentTypeName(sale.documentType)}</p>
                <p><b>Cliente:</b> ${customerName || (customer?.name) || 'Consumidor Final'}</p>
                <p><b>Vendedor:</b> ${sale.userId || 'N/A'}</p>
              </div>
              
              <div class="ticket-divider"></div>
              
              <div class="ticket-items">
                <p><b>PRODUCTOS</b></p>
                ${products.map(item => `
                  <div class="product-item">
                    <div class="product-name">${item.name}</div>
                    <div>${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}</div>
                    ${item.isConversion ? `<div style="font-size: 10px;">Presentación: ${item.unit} (Factor: ${item.conversionFactor})</div>` : ''}
                  </div>
                `).join('')}
              </div>
              
              <div class="ticket-divider"></div>
              
              <div class="product-total">
                <p>TOTAL: $${parseFloat(sale.total).toFixed(2)}</p>
              </div>
              
              <div class="ticket-footer">
                <p>Gracias por su compra!</p>
                <p>Punto Pastelero</p>
              </div>
              
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                };
              </script>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        
        // También crear un blob para descargar los comandos ESC/POS como alternativa
        try {
          // Crear un objeto EscPos para generar los comandos de la impresora térmica
          const escpos = new EscPos();
          
          // Configuración inicial
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
            .text(`Comprobante: ${getDocumentTypeName(sale.documentType)}`)
            .text(`Cliente: ${customerName || (customer?.name) || 'Consumidor Final'}`)
            .text(`Vendedor: ${sale.userId || 'N/A'}`)
            .text('----------------------------------')
            .text('PRODUCTOS')
            .text('----------------------------------');
          
          // Agregar productos
          products.forEach(item => {
            escpos
              .text(`${item.name}`)
              .text(`${item.quantity} x $${parseFloat(item.price).toFixed(2)} = $${parseFloat(item.total).toFixed(2)}`)
              .text('');
          });
          
          // Totales
          escpos
            .text('----------------------------------')
            .align('right')
            .text(`TOTAL: $${parseFloat(sale.total).toFixed(2)}`)
            .align('center')
            .text('')
            .text('Gracias por su compra!')
            .text('Punto Pastelero')
            .cut();
          
          // Obtener los comandos como un Blob
          const blob = new Blob([escpos.getBuffer()], { type: 'application/octet-stream' });
          
          // Guardar para posible descarga por el usuario
          localStorage.setItem('lastEscposTicket', URL.createObjectURL(blob));
        } catch (e) {
          console.warn('Error al generar comandos ESC/POS:', e);
        }
      } else {
        console.error('No se pudo abrir la ventana de impresión');
      }
      
      setIsPrinting(false);
    } catch (error) {
      console.error('Error al imprimir ticket:', error);
      setIsPrinting(false);
    }
  };

  // Función para obtener el nombre amigable del tipo de documento
  const getDocumentTypeName = (type: string) => {
    switch (type) {
      case 'remito': return 'Remito';
      case 'factura_a': return 'Factura A';
      case 'factura_b': return 'Factura B';
      case 'factura_c': return 'Factura C';
      default: return type;
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={printTicket}
      disabled={isPrinting}
    >
      {isPrinting ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Imprimiendo...
        </>
      ) : (
        <>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Ticket
        </>
      )}
    </Button>
  );
}