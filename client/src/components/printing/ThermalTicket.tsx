import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { PrintService } from '@/services/printService';

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
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
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
  },
  variant = 'outline',
  size = 'sm'
}: ThermalTicketProps) {
  // Utilizar saleItems si están definidos, o items como alternativa
  const products = saleItems || items;
  const [isPrinting, setIsPrinting] = useState(false);

  const printTicket = async () => {
    try {
      setIsPrinting(true);
      
      // Usar el servicio centralizado para imprimir
      await PrintService.printTicket({
        sale,
        items: products,
        customer,
        customerName,
        businessInfo
      });
      
      setIsPrinting(false);
      return true;
    } catch (error) {
      console.error('Error al imprimir ticket:', error);
      setIsPrinting(false);
      return false;
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
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