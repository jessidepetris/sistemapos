import { EscPos } from 'escpos-printer-toolkit';

export interface PrintLabelOptions {
  description: string;
  barcode: string;
  businessInfo?: {
    name: string;
  };
}

export const LabelPrintService = {
  async printLabel({
    description,
    barcode,
    businessInfo = {
      name: 'PUNTO PASTELERO',
    }
  }: PrintLabelOptions): Promise<boolean> {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        console.error('No se pudo abrir la ventana de impresión');
        return false;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Etiqueta - ${businessInfo.name}</title>
            <style>
              @page {
                size: 40mm 30mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin: 0;
                padding: 4px;
                text-align: center;
              }
              #barcode {
                margin-top: 2mm;
              }
            </style>
          </head>
          <body>
            <div>${description}</div>
            <svg id="barcode"></svg>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
              JsBarcode('#barcode', '${barcode}', { displayValue: false });
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 1000);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();

      try {
        const escpos = new EscPos();
        escpos
          .initialize()
          .align('center')
          .text(description)
          .barcode('CODE128', barcode)
          .cut();
        const blob = new Blob([escpos.getBuffer()], { type: 'application/octet-stream' });
        localStorage.setItem('lastEscposLabel', URL.createObjectURL(blob));
      } catch (e) {
        console.warn('Error al generar comandos ESC/POS:', e);
      }

      return true;
    } catch (error) {
      console.error('Error al imprimir etiqueta:', error);
      return false;
    }
  },
};
