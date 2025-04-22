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
          .text(`${item.quantity} x $${item.price.toFixed(2)} = $${item.total.toFixed(2)}`)
          .text('');
      });
      
      // Totales
      escpos
        .text('----------------------------------')
        .align('right')
        .text(`TOTAL: $${sale.total.toFixed(2)}`)
        .align('center')
        .text('')
        .text('Gracias por su compra!')
        .text('Punto Pastelero')
        .cut();
      
      // Obtener los comandos como un Blob
      const blob = new Blob([escpos.getBuffer()], { type: 'application/octet-stream' });
      
      // Para impresoras USB/red, usualmente se envía a través de un servicio
      // Aquí generamos un archivo descargable como una opción alternativa
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${sale.id}.bin`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // En producción, podría enviarse a un endpoint del backend que maneje la impresión
      // await fetch('/api/print', { method: 'POST', body: blob });
      
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