'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import QRCode from 'qrcode.react';

interface ProductResult {
  name: string;
  price: number;
  imageUrl?: string;
  variants?: any;
  isComposite?: boolean;
  components?: { name: string; quantity: number }[];
}

export default function PublicVerificadorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [message, setMessage] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  const startScanner = () => {
    const reader = readerRef.current;
    if (!reader) return;
    let active = true;
    reader.decodeFromVideoDevice(null, videoRef.current, async (result) => {
      if (!active) return;
      if (result) {
        active = false;
        const code = result.getText();
        try {
          const res = await fetch(`/api/public-products/barcode/${code}`);
          if (res.ok) {
            const data = await res.json();
            setProduct(data);
            setMessage('');
          } else {
            setProduct(null);
            setMessage('Producto no encontrado');
          }
        } catch {
          setProduct(null);
          setMessage('Error al buscar producto');
        } finally {
          reader.reset();
        }
      }
    });
    return () => {
      active = false;
      reader.reset();
    };
  };

  useEffect(() => {
    readerRef.current = new BrowserMultiFormatReader();
    const cleanup = startScanner();
    setPageUrl(window.location.href);
    return () => {
      cleanup && cleanup();
    };
  }, []);

  const handleRescan = () => {
    setProduct(null);
    setMessage('');
    startScanner();
  };

  return (
    <div className="p-4 flex flex-col min-h-screen items-center space-y-4">
      <header className="text-center space-y-2">
        <img src="/logo.png" alt="Punto Pastelero" className="mx-auto h-16" />
        <h1 className="text-xl font-bold">Verificador de precios</h1>
      </header>
      <video ref={videoRef} className="w-full max-w-sm border" />
      {product && (
        <div className="space-y-2 text-center">
          <p className="font-semibold">{product.name}</p>
          <p className="text-lg font-bold">${product.price}</p>
          {product.isComposite && product.components && (
            <div>
              <h3 className="font-semibold">Componentes:</h3>
              <ul className="list-disc ml-4 text-left">
                {product.components.map(c => (
                  <li key={c.name}>{c.name} x{c.quantity}</li>
                ))}
              </ul>
            </div>
          )}
          {product.variants && (
            <p className="text-sm">
              {Object.entries(product.variants as Record<string, any>)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ')}
            </p>
          )}
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-32 h-32 object-cover mx-auto"
            />
          )}
        </div>
      )}
      {message && <p className="text-red-500">{message}</p>}
      {(product || message) && (
        <button
          onClick={handleRescan}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Escanear otro producto
        </button>
      )}
      <div className="mt-auto flex flex-col items-center space-y-2">
        {pageUrl && <QRCode value={pageUrl} size={96} />}
        <p className="text-xs text-center">
          Escaneá este QR para usar el verificador
        </p>
        <p className="text-xs text-gray-500">
          © Punto Pastelero
        </p>
      </div>
    </div>
  );
}

