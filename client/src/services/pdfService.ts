import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export const PDFService = {
  async generateInvoicePDF(sale: any, items: any[], customer: any) {
    try {
      // Crear un documento PDF directamente sin usar imagen
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Configuración de márgenes y dimensiones
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = 20; // Posición Y inicial
      
      // Funciones auxiliares para posicionamiento
      const mm = (px: number) => px * 0.35; // Conversión aproximada px a mm
      const centerText = (text: string, y: number, fontSize = 10) => {
        pdf.setFontSize(fontSize);
        const textWidth = pdf.getTextWidth(text);
        pdf.text(text, (pageWidth - textWidth) / 2, y);
      };
      
      // Añadir encabezado
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('PUNTO PASTELERO', margin, yPos);
      
      // Logo de la empresa (si lo tuviéramos)
      // pdf.addImage(logoData, 'PNG', pageWidth - 50, 15, 30, 15);
      
      // Información de la empresa
      yPos += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('Avenida Siempre Viva 123, Springfield', margin, yPos);
      yPos += 5;
      pdf.text('Teléfono: (555) 123-4567', margin, yPos);
      yPos += 5;
      pdf.text('CUIT: 30-12345678-9', margin, yPos);
      
      // Tipo de documento y número
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      const docType = sale.documentType.startsWith('factura') 
          ? sale.documentType.replace('_', ' ').toUpperCase() 
          : 'REMITO';
      pdf.text(docType, pageWidth - margin - pdf.getTextWidth(docType), 25);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const docNumber = `N°: ${sale.id || '-------'}`;
      pdf.text(docNumber, pageWidth - margin - pdf.getTextWidth(docNumber), 30);
      
      const docDate = `Fecha: ${new Date(sale.timestamp).toLocaleDateString()}`;
      pdf.text(docDate, pageWidth - margin - pdf.getTextWidth(docDate), 35);
      
      // Línea separadora
      yPos += 10;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      // Datos del cliente
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('DATOS DEL CLIENTE', margin, yPos);
      
      yPos += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Cliente: ${customer?.name || 'Consumidor Final'}`, margin, yPos);
      
      if (customer) {
        yPos += 5;
        pdf.text(`CUIT/DNI: ${customer.taxId || customer.documentId || '-'}`, margin, yPos);
        yPos += 5;
        pdf.text(`Dirección: ${customer.address || '-'}`, margin, yPos);
        yPos += 5;
        pdf.text(`Teléfono: ${customer.phone || '-'}`, margin, yPos);
      }
      
      // Línea separadora
      yPos += 7;
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      
      // Detalles de productos
      yPos += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('DETALLE DE PRODUCTOS', margin, yPos);
      
      // Encabezados de tabla
      yPos += 7;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos - 5, contentWidth, 7, 'F');
      
      pdf.setFontSize(9);
      pdf.text('Descripción', margin + 2, yPos);
      pdf.text('Cantidad', margin + 90, yPos);
      pdf.text('Precio Unit.', margin + 120, yPos);
      pdf.text('Subtotal', pageWidth - margin - 15, yPos, { align: 'right' });
      
      // Filas de productos
      yPos += 5;
      pdf.setFont('helvetica', 'normal');
      
      items.forEach((item) => {
        if (yPos > 250) { // Control de paginación
          pdf.addPage();
          yPos = 20;
        }
        
        // Descripción con posible presentación
        pdf.text(item.name, margin + 2, yPos);
        
        if (item.isConversion) {
          yPos += 4;
          pdf.setFontSize(8);
          pdf.text(`Presentación: ${item.unit} (Factor: ${item.conversionFactor})`, margin + 5, yPos);
          pdf.setFontSize(9);
        }
        
        // Cantidad y unidad
        pdf.text(`${item.quantity} ${item.unit}`, margin + 90, yPos);
        
        // Precio unitario
        const precioUnitario = `$${parseFloat(item.price).toFixed(2)}`;
        pdf.text(precioUnitario, margin + 120, yPos);
        
        // Subtotal
        const subtotal = `$${parseFloat(item.total).toFixed(2)}`;
        pdf.text(subtotal, pageWidth - margin - 2, yPos, { align: 'right' });
        
        yPos += item.isConversion ? 8 : 6;
        
        // Línea separadora entre productos
        pdf.setDrawColor(220, 220, 220);
        pdf.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
      });
      
      // Totales
      yPos += 5;
      const totalesX = pageWidth - margin - 60;
      const valoresX = pageWidth - margin - 2;
      
      pdf.text('Subtotal:', totalesX, yPos);
      pdf.text(`$${parseFloat(sale.total).toFixed(2)}`, valoresX, yPos, { align: 'right' });
      
      yPos += 6;
      pdf.text('IVA (21%):', totalesX, yPos);
      pdf.text(`$${(parseFloat(sale.total) * 0.21 / 1.21).toFixed(2)}`, valoresX, yPos, { align: 'right' });
      
      yPos += 6;
      pdf.setDrawColor(150, 150, 150);
      pdf.line(totalesX, yPos - 2, valoresX, yPos - 2);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL:', totalesX, yPos + 5);
      pdf.text(`$${parseFloat(sale.total).toFixed(2)}`, valoresX, yPos + 5, { align: 'right' });
      
      // Pie de página
      yPos = pdf.internal.pageSize.height - 20;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      centerText('Este documento no tiene valor fiscal.', yPos);
      centerText('¡Gracias por su compra!', yPos + 4);
      
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