'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface ProductResult {
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

export default function VerificadorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let active = true;
    codeReader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
      if (!active) return;
      if (result) {
        active = false;
        const code = result.getText();
        try {
          const res = await fetch(`/api/products/barcode/${code}`);
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
          codeReader.reset();
        }
      }
    });
    return () => {
      active = false;
      codeReader.reset();
    };
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Verificador de precios</h1>
      <video ref={videoRef} className="w-full border" />
      {product && (
        <div className="space-y-2">
          <p className="font-semibold">{product.name}</p>
          <p>Precio: ${product.price}</p>
          {typeof product.stock === 'number' && <p>Stock: {product.stock}</p>}
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-32 h-32 object-cover"
            />
          )}
        </div>
      )}
      {message && <p className="text-red-500">{message}</p>}
    </div>
  );
}
