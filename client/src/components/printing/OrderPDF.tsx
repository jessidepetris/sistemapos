import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown, Printer } from 'lucide-react';

interface OrderPDFProps {
  orderRef?: React.RefObject<HTMLDivElement>;
  order: any;
  showPrintButton?: boolean;
}

// Helper estático para generar PDF desde cualquier contexto
export const OrderPDFHelper = {
  async generate(order: any) {
    try {
      console.log("Generando PDF para el pedido:", order);
      
      // Formatear fecha
      const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return "No disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      };
      
      // Extraer items del pedido y asegurar que tengan nombres correctos
      const items = (order.items || []).map((item: any) => {
        // Intentar buscar el producto en todas las fuentes posibles
        let productName;
        
        // 1. Si el item ya tiene una propiedad product con nombre, usarla
        if (item.product && item.product.name) {
          productName = item.product.name;
        } 
        // 2. O si el item tiene productName directamente
        else if (item.productName) {
          productName = item.productName;
        }
        // 3. O si hay una lista de productos en el pedido, buscar por ID
        else if (order.products) {
          const product = order.products.find((p: any) => p.id === item.productId);
          if (product && product.name) {
            productName = product.name;
          }
        }
        // 4. O si tiene un nombre como propiedad
        else if (typeof item.name === 'string') {
          productName = item.name;
        }
        // 5. Como último recurso, mostrar el ID del producto
        else {
          productName = `Producto #${item.productId}`;
        }
        
        return {
          ...item,
          displayName: productName,
          quantity: item.quantity,
          unit: item.unit || '',
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
        };
      });
      
      // Agrupar los productos por categoría
      const refrigeratedItems = items.filter((item: any) => 
        item.product?.isRefrigerated && !item.product?.isBulk
      );
      
      const bulkItems = items.filter((item: any) => 
        item.product?.isBulk
      );
      
      const regularItems = items.filter((item: any) => 
        !item.product?.isRefrigerated && !item.product?.isBulk
      );
      
      console.log("Items procesados para PDF:", {
        refrigerados: refrigeratedItems.length,
        granel: bulkItems.length,
        comunes: regularItems.length
      });
      
      // Crear un nuevo documento PDF (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuración de márgenes y dimensiones
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let y = margin; // Posición Y inicial
      
      // Función de ayuda para centrar texto
      const centerText = (text: string, y: number, fontSize: number = 12) => {
        pdf.setFontSize(fontSize);
        const textWidth = pdf.getStringUnitWidth(text) * fontSize / pdf.internal.scaleFactor;
        pdf.text(text, (pageWidth - textWidth) / 2, y);
      };
      
      // Encabezado del documento - Datos de la empresa
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('PUNTO PASTELERO', margin, y);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      y += 7;
      pdf.text('Avenida Siempre Viva 123, Springfield', margin, y);
      y += 5;
      pdf.text('Teléfono: (555) 123-4567', margin, y);
      y += 5;
      pdf.text('CUIT: 30-12345678-9', margin, y);
      
      // Información del pedido - Parte derecha
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('PEDIDO', pageWidth - margin - 30, margin);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`N°: ${order.id || '-------'}`, pageWidth - margin - 30, margin + 7);
      pdf.text(`Fecha: ${formatDate(order.timestamp || order.createdAt)}`, pageWidth - margin - 30, margin + 12);
      pdf.text(`Estado: ${order.status || 'Pendiente'}`, pageWidth - margin - 30, margin + 17);
      
      // Línea separadora
      y += 10;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Datos del cliente
      y += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DATOS DEL CLIENTE', margin, y);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      y += 7;
      pdf.text(`Cliente: ${order.customer?.name || order.customerData?.name || 'Sin cliente asignado'}`, margin, y);
      
      if (order.customer?.phone || order.customerData?.phone) {
        y += 5;
        pdf.text(`Teléfono: ${order.customer?.phone || order.customerData?.phone}`, margin, y);
      }
      
      if (order.customer?.email || order.customerData?.email) {
        y += 5;
        pdf.text(`Email: ${order.customer?.email || order.customerData?.email}`, margin, y);
      }
      
      if (order.customer?.address || order.customerData?.address) {
        y += 5;
        pdf.text(`Dirección: ${order.customer?.address || order.customerData?.address}`, margin, y);
      }
      
      // Línea separadora
      y += 10;
      pdf.line(margin, y, pageWidth - margin, y);
      
      // Detalle de productos
      y += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('DETALLE DEL PEDIDO', margin, y);
      
      // Encabezados de tabla
      y += 10;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, y - 5, contentWidth, 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Producto', margin + 3, y);
      pdf.text('Cantidad', margin + 90, y);
      pdf.text('Precio', margin + 120, y);
      pdf.text('Subtotal', pageWidth - margin - 10, y, { align: 'right' });
      y += 8;
      
      // Función para dibujar una sección de productos
      const renderProductSection = (title: string, productList: any[]) => {
        if (productList.length === 0) return;
        
        // Verificar si necesitamos una nueva página
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = margin;
        }
        
        // Encabezado de categoría
        pdf.setFillColor(230, 230, 230);
        pdf.rect(margin, y - 5, contentWidth, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin + 3, y);
        y += 8;
        
        // Productos en esta categoría
        pdf.setFont('helvetica', 'normal');
        
        for (const item of productList) {
          // Verificar si necesitamos una nueva página
          if (y > pageHeight - 30) {
            pdf.addPage();
            y = margin;
          }
          
          // Nombre del producto (cortar si es muy largo)
          let displayName = item.displayName;
          if (displayName.length > 40) {
            displayName = displayName.substring(0, 37) + '...';
          }
          
          pdf.text(displayName, margin + 3, y);
          pdf.text(`${item.quantity} ${item.unit}`, margin + 90, y);
          pdf.text(`$${item.price.toFixed(2)}`, margin + 120, y);
          pdf.text(`$${item.total.toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
          
          // Línea separadora
          y += 7;
          pdf.setDrawColor(220, 220, 220);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 5;
        }
      };
      
      // Renderizar cada sección de productos
      if (refrigeratedItems.length > 0) {
        renderProductSection("PRODUCTOS REFRIGERADOS", refrigeratedItems);
      }
      
      if (bulkItems.length > 0) {
        renderProductSection("PRODUCTOS A GRANEL", bulkItems);
      }
      
      if (regularItems.length > 0) {
        renderProductSection("PRODUCTOS COMUNES", regularItems);
      }
      
      // Total
      y += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL:', pageWidth - margin - 40, y);
      pdf.text(`$${parseFloat(order.total).toFixed(2)}`, pageWidth - margin - 3, y, { align: 'right' });
      
      // Notas
      if (order.notes) {
        y += 15;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('NOTAS', margin, y);
        
        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        
        // Dividir notas largas en múltiples líneas
        const notesWidth = contentWidth;
        const lines = pdf.splitTextToSize(order.notes, notesWidth);
        
        for (const line of lines) {
          if (y > pageHeight - 30) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += 5;
        }
      }
      
      // Información de entrega
      if (order.deliveryDate) {
        y += 10;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('INFORMACIÓN DE ENTREGA', margin, y);
        
        y += 7;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Fecha de entrega: ${formatDate(order.deliveryDate)}`, margin, y);
        
        y += 5;
        let deliveryMethod = 'No especificado';
        if (order.deliveryMethod === 'pickup') {
          deliveryMethod = 'Retiro en Sucursal';
        } else if (order.deliveryMethod === 'shipping') {
          deliveryMethod = `Envío por Comisionista/Correo`;
          if (order.shippingInfo) {
            y += 5;
            pdf.text(`Información: ${order.shippingInfo}`, margin, y);
          }
        } else if (order.route) {
          deliveryMethod = `Ruta: ${order.route.name}`;
        }
        pdf.text(`Método de entrega: ${deliveryMethod}`, margin, y);
      }
      
      // Guardar PDF con nombre de archivo basado en el pedido
      pdf.save(`Pedido_${order.id || 'Nuevo'}.pdf`);
      
      return true;
    } catch (error) {
      console.error("Error al generar PDF:", error);
      return false;
    }
  }
};

export function OrderPDF({ orderRef, order, showPrintButton = false }: OrderPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const localRef = useRef<HTMLDivElement>(null);
  const ref = orderRef || localRef;

  const generatePDF = async () => {
    if (!order) return;
    
    try {
      setIsGenerating(true);
      await OrderPDFHelper.generate(order);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const printOrder = async () => {
    if (!order) return;
    
    try {
      setIsPrinting(true);
      
      // Crear una ventana de impresión
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        console.error('No se pudo abrir la ventana de impresión');
        return;
      }
      
      // Formatear fecha
      const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return "No disponible";
        const date = new Date(dateString);
        return date.toLocaleDateString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      };
      
      // Procesar items para impresión
      const items = (order.items || []).map((item: any) => {
        // Intentar buscar el producto en todas las fuentes posibles
        let productName;
        
        // 1. Si el item ya tiene una propiedad product con nombre, usarla
        if (item.product && item.product.name) {
          productName = item.product.name;
        } 
        // 2. O si el item tiene productName directamente
        else if (item.productName) {
          productName = item.productName;
        }
        // 3. O si hay una lista de productos en el pedido, buscar por ID
        else if (order.products) {
          const product = order.products.find((p: any) => p.id === item.productId);
          if (product && product.name) {
            productName = product.name;
          }
        }
        // 4. O si tiene un nombre como propiedad
        else if (typeof item.name === 'string') {
          productName = item.name;
        }
        // 5. Como último recurso, mostrar el ID del producto
        else {
          productName = `Producto #${item.productId}`;
        }
        
        return {
          ...item,
          displayName: productName,
          quantity: item.quantity,
          unit: item.unit || '',
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          total: typeof item.total === 'string' ? parseFloat(item.total) : item.total
        };
      });
      
      // Escribir el contenido HTML en la ventana de impresión
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Pedido #${order.id || 'Nuevo'}</title>
            <style>
              @page { 
                size: auto;
                margin: 10mm;
              }
              body { 
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                background-color: white;
              }
              .header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .header-left h1 {
                margin: 0;
                font-size: 24px;
              }
              .header-left p {
                margin: 5px 0;
                color: #666;
              }
              .header-right {
                text-align: right;
              }
              .header-right h2 {
                margin: 0;
                font-size: 18px;
              }
              .header-right p {
                margin: 5px 0;
                color: #666;
              }
              .section {
                margin-bottom: 20px;
              }
              .section-title {
                margin: 0 0 10px 0;
                font-size: 14px;
                text-transform: uppercase;
                color: #666;
              }
              .customer-info {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
              }
              .items-table th {
                background-color: #f5f5f5;
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #ddd;
              }
              .items-table th:nth-child(2),
              .items-table th:nth-child(3),
              .items-table th:nth-child(4) {
                text-align: right;
              }
              .items-table td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
              }
              .items-table td:nth-child(2),
              .items-table td:nth-child(3),
              .items-table td:nth-child(4) {
                text-align: right;
              }
              .items-table tfoot td {
                font-weight: bold;
              }
              .items-table tfoot td:first-child {
                text-align: right;
              }
              .notes {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-left">
                <h1>PUNTO PASTELERO</h1>
                <p>Avenida Siempre Viva 123, Springfield</p>
                <p>(555) 123-4567</p>
                <p>CUIT: 30-12345678-9</p>
              </div>
              <div class="header-right">
                <h2>PEDIDO</h2>
                <p>N°: ${order.id || '-------'}</p>
                <p>Fecha: ${formatDate(order.timestamp || order.createdAt)}</p>
                <p>Estado: ${order.status}</p>
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Datos del cliente</h3>
              <div class="customer-info">
                <p><strong>Cliente:</strong> ${order.customer?.name || order.customerData?.name || 'Sin cliente asignado'}</p>
                ${order.customer?.phone || order.customerData?.phone ? `<p><strong>Teléfono:</strong> ${order.customer?.phone || order.customerData?.phone}</p>` : ''}
                ${order.customer?.email || order.customerData?.email ? `<p><strong>Email:</strong> ${order.customer?.email || order.customerData?.email}</p>` : ''}
                ${order.customer?.address || order.customerData?.address ? `<p><strong>Dirección:</strong> ${order.customer?.address || order.customerData?.address}</p>` : ''}
              </div>
            </div>
            
            <div class="section">
              <h3 class="section-title">Detalle del Pedido</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((item: any) => `
                    <tr>
                      <td>${item.displayName}</td>
                      <td>${item.quantity} ${item.unit}</td>
                      <td>$${item.price.toFixed(2)}</td>
                      <td>$${item.total.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3">Total:</td>
                    <td>$${parseFloat(order.total).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            ${order.notes ? `
              <div class="section">
                <h3 class="section-title">Notas</h3>
                <p class="notes">${order.notes}</p>
              </div>
            ` : ''}
            
            ${order.deliveryDate ? `
              <div class="section">
                <h3 class="section-title">Información de Entrega</h3>
                <p><strong>Fecha de Entrega:</strong> ${formatDate(order.deliveryDate)}</p>
                <p><strong>Método de Entrega:</strong> ${
                  order.deliveryMethod === 'pickup' 
                    ? 'Retiro en Sucursal' 
                    : order.deliveryMethod === 'shipping'
                      ? `Envío por Comisionista/Correo${order.shippingInfo ? ` - ${order.shippingInfo}` : ''}`
                      : (order.route ? `Ruta: ${order.route.name}` : 'Entrega a domicilio')
                }</p>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Este documento es un comprobante de pedido y no tiene valor fiscal.</p>
              <p>¡Gracias por su compra!</p>
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
    } catch (error) {
      console.error('Error al imprimir pedido:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={generatePDF}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <FileDown className="h-4 w-4 mr-2" />
            Descargar PDF
          </>
        )}
      </Button>
      
      {showPrintButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={printOrder}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparando...
            </>
          ) : (
            <>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </>
          )}
        </Button>
      )}
    </div>
  );
} 
