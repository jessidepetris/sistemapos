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