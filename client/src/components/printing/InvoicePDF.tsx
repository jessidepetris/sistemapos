import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';
import { Loader2, FileDown } from 'lucide-react';

interface InvoicePDFProps {
  invoiceRef: React.RefObject<HTMLDivElement>;
  documentId: number;
  documentType: string;
}

// Helper estático para generar PDF desde cualquier contexto
export const InvoicePDFHelper = {
  async generate(sale: any, items: any[], customer: any) {
    try {
      // Crear un elemento temporal para renderizar la factura
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      
      // Renderizar el contenido de la factura (versión simplificada)
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; width: 210mm;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h1 style="margin: 0; color: #333; font-size: 24px;">PUNTO PASTELERO</h1>
              <p style="margin: 5px 0; color: #666;">Avenida Siempre Viva 123, Springfield</p>
              <p style="margin: 5px 0; color: #666;">(555) 123-4567</p>
              <p style="margin: 5px 0; color: #666;">CUIT: 30-12345678-9</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 18px;">${sale.documentType.startsWith('factura') 
                ? sale.documentType.replace('_', ' ').toUpperCase() 
                : 'REMITO'}</h2>
              <p style="margin: 5px 0; color: #666;">N°: ${sale.id || '-------'}</p>
              <p style="margin: 5px 0; color: #666;">Fecha: ${new Date(sale.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">Datos del cliente</h3>
            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${customer?.name || 'Consumidor Final'}</p>
            ${customer ? `
              <p style="margin: 5px 0;"><strong>CUIT/DNI:</strong> ${customer.taxId || customer.documentId || '-'}</p>
              <p style="margin: 5px 0;"><strong>Dirección:</strong> ${customer.address || '-'}</p>
              <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${customer.phone || '-'}</p>
            ` : ''}
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #666;">Detalle de productos</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 1px solid #ddd;">
                  <th style="padding: 8px; text-align: left;">Descripción</th>
                  <th style="padding: 8px; text-align: right;">Cantidad</th>
                  <th style="padding: 8px; text-align: right;">Precio Unit.</th>
                  <th style="padding: 8px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item) => `
                  <tr style="border-bottom: 1px dashed #ddd;">
                    <td style="padding: 8px;">
                      ${item.name}
                      ${item.isConversion ? `
                        <div style="font-size: 12px; color: #666;">
                          Presentación: ${item.unit} (Factor: ${item.conversionFactor})
                        </div>
                      ` : ''}
                    </td>
                    <td style="padding: 8px; text-align: right;">${item.quantity} ${item.unit}</td>
                    <td style="padding: 8px; text-align: right;">$${parseFloat(item.price).toFixed(2)}</td>
                    <td style="padding: 8px; text-align: right;">$${parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">
            <div style="width: 250px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: 500;">Subtotal:</span>
                <span>$${parseFloat(sale.subtotal || sale.total).toFixed(2)}</span>
              </div>
              ${parseFloat(sale.discountPercent) > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #388e3c;">
                  <span>Descuento (${sale.discountPercent}%):</span>
                  <span>-$${parseFloat(sale.discount).toFixed(2)}</span>
                </div>
              ` : ''}
              ${parseFloat(sale.surchargePercent) > 0 ? `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #e65100;">
                  <span>Recargo (${sale.surchargePercent}%):</span>
                  <span>+$${parseFloat(sale.surcharge).toFixed(2)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: bold; font-size: 18px; border-top: 1px solid #ddd; margin-top: 8px;">
                <span>TOTAL:</span>
                <span>$${parseFloat(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 16px;">
            <p style="margin: 4px 0;">Este documento no tiene valor fiscal.</p>
            <p style="margin: 4px 0;">¡Gracias por su compra!</p>
          </div>
        </div>
      `;
      
      // Capturar el elemento como imagen
      const dataUrl = await toPng(tempDiv, { quality: 0.95 });
      
      // Limpiar el elemento temporal
      document.body.removeChild(tempDiv);
      
      // Crear un nuevo documento PDF (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Obtener dimensiones y ajustar la imagen al PDF
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      // Calcular escala para que el ancho se ajuste al PDF
      const scale = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * scale;
      
      // Si la altura escalada es mayor que la página, ajustar nuevamente
      const finalScale = scaledHeight > pdfHeight ? pdfHeight / scaledHeight * scale : scale;
      const finalWidth = imgWidth * finalScale;
      const finalHeight = imgHeight * finalScale;
      
      // Agregar la imagen al PDF
      pdf.addImage(dataUrl, 'PNG', 
        (pdfWidth - finalWidth) / 2, // Centrar horizontalmente
        10, // Margen superior
        finalWidth, 
        finalHeight
      );
      
      // Guardar el PDF
      const documentType = sale.documentType || 'documento';
      const documentId = sale.id || Date.now();
      const fileName = `${documentType.replace('_', '')}_${documentId}.pdf`;
      pdf.save(fileName);
      
      return true;
    } catch (error) {
      console.error('Error al generar PDF:', error);
      return false;
    }
  }
};

export function InvoicePDF({ invoiceRef, documentId, documentType }: InvoicePDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const getDocumentName = (type: string) => {
    switch (type) {
      case 'remito': return 'Remito';
      case 'factura_a': return 'Factura_A';
      case 'factura_b': return 'Factura_B';
      case 'factura_c': return 'Factura_C';
      default: return 'Documento';
    }
  };

  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      setIsGenerating(true);
      
      // Capturar el elemento HTML como una imagen PNG
      const dataUrl = await toPng(invoiceRef.current, { quality: 0.95 });
      
      // Crear un nuevo documento PDF (A4)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Obtener dimensiones de la imagen y el PDF
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = imgProps.width;
      const imgHeight = imgProps.height;
      
      // Calcular escala para que el ancho se ajuste al PDF
      const scale = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * scale;
      
      // Si la altura escalada es mayor que la página, ajustar nuevamente
      const finalScale = scaledHeight > pdfHeight ? pdfHeight / scaledHeight * scale : scale;
      const finalWidth = imgWidth * finalScale;
      const finalHeight = imgHeight * finalScale;
      
      // Agregar la imagen al PDF
      pdf.addImage(dataUrl, 'PNG', 
        (pdfWidth - finalWidth) / 2, // Centrar horizontalmente
        10, // Margen superior
        finalWidth, 
        finalHeight
      );
      
      // Guardar el PDF
      const fileName = `${getDocumentName(documentType)}_${documentId}.pdf`;
      pdf.save(fileName);
      
      setIsGenerating(false);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setIsGenerating(false);
    }
  };

  return (
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
          Exportar a PDF
        </>
      )}
    </Button>
  );
}
