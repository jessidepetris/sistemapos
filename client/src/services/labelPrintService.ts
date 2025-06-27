import { EscPos } from 'escpos-printer-toolkit';

export interface PrintLabelOptions {
  description: string;
  barcode: string;
  businessInfo?: {
    name: string;
  };
  /** Width of the label in millimeters */
  width?: number;
  /** Height of the label in millimeters */
  height?: number;
  /** CSS border-radius value to control label shape */
  borderRadius?: string;
}

export const LabelPrintService = {
  async printLabel({
    description,
    barcode,
    businessInfo = {
      name: 'PUNTO PASTELERO',
    },
    width = 40,
    height = 30,
    borderRadius = '0'
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
                size: ${width}mm ${height}mm;
                margin: 0;
              }
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                margin: 0;
                padding: 4px;
                text-align: center;
                width: ${width}mm;
                height: ${height}mm;
              }
              #label-container {
                border-radius: ${borderRadius};
                width: ${width}mm;
                height: ${height}mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
              }
              #barcode {
                margin-top: 2mm;
              }
            </style>
          </head>
          <body>
            <div id="label-container">
              <div>${description}</div>
              <svg id="barcode"></svg>
            </div>
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
