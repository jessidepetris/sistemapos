import { useRef, forwardRef } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { ThermalTicket } from '@/components/printing/ThermalTicket';
import { InvoicePDF } from '@/components/printing/InvoicePDF';

interface InvoiceDetailProps {
  invoice: any;
  items: any[];
  customer?: any;
}

// Componente de contenido del remito/factura
export const InvoiceContent = forwardRef<HTMLDivElement, InvoiceDetailProps>(
  ({ invoice, items, customer }, ref) => {
    // Información de la empresa
    const businessInfo = {
      name: 'PUNTO PASTELERO',
      address: 'Avenida Siempre Viva 123, Springfield',
      phone: '(555) 123-4567',
      taxId: '30-12345678-9',
    };

    const getDocumentTypeName = (type: string) => {
      switch (type) {
        case 'remito': return 'Remito';
        case 'factura_a': return 'Factura A';
        case 'factura_b': return 'Factura B';
        case 'factura_c': return 'Factura C';
        default: return type;
      }
    };

    const getStatusName = (status: string) => {
      switch (status) {
        case 'pending': return 'Pendiente';
        case 'processing': return 'En proceso';
        case 'completed': return 'Completado';
        case 'canceled': return 'Cancelado';
        default: return status;
      }
    };

    const getPaymentMethodName = (method: string) => {
      switch (method) {
        case 'cash': return 'Efectivo';
        case 'card': return 'Tarjeta';
        case 'transfer': return 'Transferencia';
        case 'account': return 'Cuenta Corriente';
        case 'mixed': return 'Pago mixto';
        default: return method;
      }
    };

    return (
      <div ref={ref} className="bg-white p-6 rounded-lg shadow-sm w-full max-w-3xl mx-auto">
        {/* Encabezado del documento */}
        <div className="border-b pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-primary">{businessInfo.name}</h1>
              <p className="text-muted-foreground">{businessInfo.address}</p>
              <p className="text-muted-foreground">{businessInfo.phone}</p>
              <p className="text-muted-foreground">CUIT: {businessInfo.taxId}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold">{getDocumentTypeName(invoice.documentType)}</h2>
              <p className="text-muted-foreground">N°: {invoice.id}</p>
              <p className="text-muted-foreground">
                Fecha: {format(new Date(invoice.timestamp), 'dd/MM/yyyy HH:mm')}
              </p>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  invoice.status === 'completed' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'canceled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {getStatusName(invoice.status)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Datos del cliente */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Datos del cliente</h3>
          <div className="bg-muted/30 p-3 rounded">
            <p><span className="font-medium">Cliente:</span> {customer?.name || 'Consumidor Final'}</p>
            {customer && (
              <>
                <p><span className="font-medium">CUIT/DNI:</span> {customer.taxId || customer.documentId || '-'}</p>
                <p><span className="font-medium">Dirección:</span> {customer.address || '-'}</p>
                <p><span className="font-medium">Teléfono:</span> {customer.phone || '-'}</p>
              </>
            )}
          </div>
        </div>

        {/* Listado de productos */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Detalle de productos</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2 text-left">Descripción</th>
                <th className="py-2 text-right">Cantidad</th>
                <th className="py-2 text-right">Precio Unit.</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="border-b border-dashed">
                  <td className="py-2">
                    <div>
                      <p>{item.product?.name || 'Producto'}</p>
                      {item.isConversion && (
                        <p className="text-xs text-muted-foreground">
                          Presentación: {item.unit} (Factor: {item.conversionFactor})
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                  <td className="py-2 text-right">${parseFloat(item.price).toFixed(2)}</td>
                  <td className="py-2 text-right">${parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="font-medium">Subtotal:</span>
              <span>${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-muted-foreground">
              <span>IVA (21%):</span>
              <span>${(parseFloat(invoice.total) * 0.21 / 1.21).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg border-t mt-2">
              <span>TOTAL:</span>
              <span>${parseFloat(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Detalles de pago */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Información de pago</h3>
          <div className="bg-muted/30 p-3 rounded">
            <p><span className="font-medium">Método de pago:</span> {getPaymentMethodName(invoice.paymentMethod)}</p>
            
            {invoice.paymentMethod === 'mixed' && invoice.paymentDetails && (
              <div className="mt-2">
                <p className="text-sm font-medium">Detalles del pago mixto:</p>
                <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                  {invoice.paymentDetails.mixedPayment?.cash > 0 && (
                    <p>Efectivo: ${invoice.paymentDetails.mixedPayment.cash.toFixed(2)}</p>
                  )}
                  {invoice.paymentDetails.mixedPayment?.card > 0 && (
                    <p>Tarjeta: ${invoice.paymentDetails.mixedPayment.card.toFixed(2)}</p>
                  )}
                  {invoice.paymentDetails.mixedPayment?.transfer > 0 && (
                    <p>Transferencia: ${invoice.paymentDetails.mixedPayment.transfer.toFixed(2)}</p>
                  )}
                  {invoice.paymentDetails.mixedPayment?.account > 0 && (
                    <p>Cuenta Corriente: ${invoice.paymentDetails.mixedPayment.account.toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}
            
            {invoice.paymentMethod === 'card' && invoice.paymentDetails && (
              <p className="mt-1 text-sm">
                Tipo de tarjeta: {invoice.paymentDetails.cardType === 'credit' ? 'Crédito' : 'Débito'}
              </p>
            )}
          </div>
        </div>

        {/* Observaciones */}
        {invoice.notes && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Observaciones</h3>
            <div className="bg-muted/30 p-3 rounded">
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Pie del documento */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p>Este documento no tiene valor fiscal.</p>
          <p>¡Gracias por su compra!</p>
        </div>
      </div>
    );
  }
);

InvoiceContent.displayName = 'InvoiceContent';

// Componente principal que incluye la vista y las acciones
export default function InvoiceDetail({ invoice, items, customer }: InvoiceDetailProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Información de la empresa para el ticket
  const businessInfo = {
    name: 'PUNTO PASTELERO',
    address: 'Avenida Siempre Viva 123, Springfield',
    phone: '(555) 123-4567',
  };

  return (
    <Card className="p-4">
      {/* Acciones */}
      <div className="mb-6 flex gap-2 justify-end">
        <ThermalTicket 
          sale={invoice} 
          saleItems={items} 
          customerName={customer?.name} 
          businessInfo={businessInfo} 
        />
        <InvoicePDF 
          invoiceRef={invoiceRef} 
          documentId={invoice.id} 
          documentType={invoice.documentType} 
        />
      </div>
      
      {/* Contenido del remito/factura */}
      <InvoiceContent ref={invoiceRef} invoice={invoice} items={items} customer={customer} />
    </Card>
  );
}