import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

export const PDFService = {
  async generateInvoicePDF(sale: any, items: any[], customer: any): Promise<boolean> {
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
      let docType = '';
      if (sale.documentType.startsWith('factura')) {
        docType = sale.documentType.replace('_', ' ').toUpperCase();
      } else if (sale.documentType === 'remito_x') {
        docType = 'REMITO X';
      } else {
        docType = 'REMITO';
      }
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
        
        // Determinar el nombre del producto de forma más robusta
        let productName = 'Producto no especificado';
        
        if (item.name) {
          // Si ya tiene nombre, usarlo
          productName = item.name;
        } else if (sale.products && sale.products.find((p: { id: number, name: string }) => p.id === item.productId)) {
          // Buscar en la lista de productos asociados a la venta
          productName = sale.products.find((p: { id: number, name: string }) => p.id === item.productId).name;
        } else if (sale.productsData && typeof sale.productsData === 'string') {
          // Intentar extraer de datos en JSON
          try {
            const productsData = JSON.parse(sale.productsData);
            const product = productsData.find((p: { id: number, name: string }) => p.id === item.productId);
            if (product && product.name) {
              productName = product.name;
            }
          } catch (e) {
            console.warn('Error al parsear productsData', e);
          }
        } else {
          // Usar el ID como último recurso
          productName = `Producto #${item.productId}`;
        }
        
        // Descripción con posible presentación
        pdf.text(productName, margin + 2, yPos);
        
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
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', totalesX, yPos);
      pdf.text(`$${parseFloat(sale.subtotal ?? sale.total ?? 0).toFixed(2)}`, valoresX, yPos, { align: 'right' });
      
      if (parseFloat(sale.discountPercent) > 0) {
        yPos += 6;
        pdf.setTextColor(56, 142, 60); // Verde
        pdf.text(`Descuento (${sale.discountPercent}%):`, totalesX, yPos);
        pdf.text(`-$${parseFloat(sale.discount ?? 0).toFixed(2)}`, valoresX, yPos, { align: 'right' });
        pdf.setTextColor(0, 0, 0); // Reset color
      }
      if (parseFloat(sale.surchargePercent) > 0) {
        yPos += 6;
        pdf.setTextColor(230, 81, 0); // Naranja
        pdf.text(`Recargo (${sale.surchargePercent}%):`, totalesX, yPos);
        pdf.text(`+$${parseFloat(sale.surcharge ?? 0).toFixed(2)}`, valoresX, yPos, { align: 'right' });
        pdf.setTextColor(0, 0, 0); // Reset color
      }
      yPos += 8;
      pdf.setFont('helvetica', 'bold');
      pdf.text('TOTAL:', totalesX, yPos);
      pdf.text(`$${parseFloat(sale.total).toFixed(2)}`, valoresX, yPos, { align: 'right' });
      
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
      
      // Crear una promesa para manejar el guardado del PDF
      return new Promise<boolean>((resolve) => {
        try {
          pdf.save(fileName);
          resolve(true);
        } catch (err) {
          console.error('Error al guardar PDF:', err);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      return Promise.resolve(false);
    }
  },

  async generateReceiptPDF(transaction: any, account: any): Promise<boolean> {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();

      const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return (
          date.toLocaleDateString() +
          " " +
          date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
      };

      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text("COMPROBANTE DE PAGO", pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`N° ${transaction.id.toString().padStart(8, "0")}`, pageWidth / 2, 30, { align: "center" });

      pdf.setLineWidth(0.5);
      pdf.line(20, 35, pageWidth - 20, 35);

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text("Punto Pastelero", 20, 45);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Insumos de Pastelería", 20, 52);
      pdf.text("Tel: (xxx) xxx-xxxx", 20, 57);
      pdf.text("Email: contacto@puntopastelero.com", 20, 62);

      pdf.line(20, 67, pageWidth - 20, 67);

      pdf.setFontSize(12);
      let y = 77;
      const lineHeight = 7;
      const addLine = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(label, 20, y);
        pdf.setFont("helvetica", "normal");
        pdf.text(value, 70, y);
        y += lineHeight;
      };

      addLine("Cuenta:", account.id.toString().padStart(8, "0"));
      addLine("Fecha:", formatDate(transaction.timestamp));
      addLine("Cliente:", account.customer?.name || "Cliente no registrado");
      addLine("Monto:", `$${parseFloat(transaction.amount).toFixed(2)}`);
      addLine(
        "Método de pago:",
        (() => {
          switch (transaction.paymentMethod) {
            case "cash":
              return "Efectivo";
            case "transfer":
              return "Transferencia";
            case "credit_card":
              return "Tarjeta de Crédito";
            case "debit_card":
              return "Tarjeta de Débito";
            case "check":
              return "Cheque";
            case "qr":
              return "QR";
            default:
              return "No especificado";
          }
        })()
      );
      addLine("Descripción:", transaction.description);

      pdf.line(20, y + 5, pageWidth - 20, y + 5);
      const amount = parseFloat(transaction.amount);
      const balanceAfter = parseFloat(transaction.balanceAfter);
      const balanceBefore =
        transaction.type === "credit"
          ? balanceAfter - amount
          : balanceAfter + amount;

      y += 15;
      pdf.setFont("helvetica", "bold");
      pdf.text("Saldo anterior:", 20, y);
      pdf.text(`$${balanceBefore.toFixed(2)}`, pageWidth - 20, y, { align: "right" });
      y += lineHeight;
      pdf.text("Saldo actual:", 20, y);
      pdf.text(`$${balanceAfter.toFixed(2)}`, pageWidth - 20, y, { align: "right" });

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "italic");
      const bottomY = pdf.internal.pageSize.getHeight() - 20;
      pdf.text("Gracias por su pago", pageWidth / 2, bottomY, { align: "center" });

      const filename = `comprobante-${transaction.id}-${formatDate(transaction.timestamp).replace(/[/: ]/g, "-")}.pdf`;
      pdf.save(filename);

      return true;
    } catch (error) {
      console.error("Error al generar PDF:", error);
      return false;
    }
  }
};
