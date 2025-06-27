import { useEffect, useRef } from 'react';

interface LabelPreviewProps {
  description: string;
  barcode: string;
  width?: number;
  height?: number;
  borderRadius?: string;
}

export function LabelPreview({
  description,
  barcode,
  width = 40,
  height = 30,
  borderRadius = '0'
}: LabelPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const renderBarcode = () => {
      // @ts-ignore
      if (window.JsBarcode && svgRef.current) {
        // @ts-ignore
        window.JsBarcode(svgRef.current, barcode, { displayValue: false });
      }
    };

    if (!(window as any).JsBarcode) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
      script.onload = renderBarcode;
      document.body.appendChild(script);
    } else {
      renderBarcode();
    }

    return () => {
      if (svgRef.current) {
        while (svgRef.current.firstChild) {
          svgRef.current.removeChild(svgRef.current.firstChild);
        }
      }
    };
  }, [barcode]);

  return (
    <div
      style={{
        width: `${width}mm`,
        height: `${height}mm`,
        borderRadius,
        border: '1px dashed #ccc',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '10px',
        padding: '2mm'
      }}
    >
      <div>{description}</div>
      <svg ref={svgRef} style={{ marginTop: '2mm' }} />
      <div style={{ fontFamily: 'monospace', marginTop: '1mm' }}>{barcode}</div>
    </div>
  );
}
