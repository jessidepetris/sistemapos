'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface ProductResult {
  id: number;
  name: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  variants?: any;
  subcategory?: string;
  isComposite?: boolean;
  components?: { name: string; quantity: number }[];
}

interface SimilarProduct {
  id: number;
  name: string;
  priceARS: number;
  imageUrl?: string;
}

export default function VerificadorPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [product, setProduct] = useState<ProductResult | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [message, setMessage] = useState('');
  const [similar, setSimilar] = useState<SimilarProduct[]>([]);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const playBeep = () => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  };

  const startScanner = () => {
    const reader = codeReaderRef.current;
    if (!reader) return;
    let active = true;
    reader.decodeFromVideoDevice(null, videoRef.current, async (result, err) => {
      if (!active) return;
      if (result) {
        active = false;
        const code = result.getText();
        setScannedCode(code);
        try {
          const res = await fetch(`/api/products/barcode/${code}`);
          if (res.ok) {
            const data = await res.json();
            setProduct(data);
            setMessage('');
            playBeep();
            const simRes = await fetch(`/api/products/${data.id}/similar`);
            if (simRes.ok) {
              const simData = await simRes.json();
              setSimilar(simData);
            }
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
    codeReaderRef.current = new BrowserMultiFormatReader();
    const cleanup = startScanner();
    return () => {
      cleanup && cleanup();
    };
  }, []);

  const copyText = async (text: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {}
  };

  const handleRescan = () => {
    setProduct(null);
    setMessage('');
    setSimilar([]);
    setScannedCode('');
    startScanner();
  };

  return (
    <div className="p-4 space-y-4 flex flex-col min-h-screen">
      <header className="text-center space-y-2">
        <img src="/logo.png" alt="Punto Pastelero" className="mx-auto h-16" />
        <h1 className="text-xl font-bold">Verificador de precios</h1>
      </header>
      <video ref={videoRef} className="w-full border" />
      {product && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <p className="font-semibold">{product.name}</p>
            <button onClick={() => copyText(product.name, setCopiedName)}>📋</button>
            {copiedName && <span className="text-xs text-green-600">Copiado ✅</span>}
          </div>
          <div className="flex items-center space-x-2">
            <p>Código: {scannedCode}</p>
            <button onClick={() => copyText(scannedCode, setCopiedCode)}>📋</button>
            {copiedCode && <span className="text-xs text-green-600">Copiado ✅</span>}
          </div>
          <p>Precio: ${product.price}</p>
          {typeof product.stock === 'number' && <p>Stock: {product.stock}</p>}
          {product.isComposite && product.components && (
            <div>
              <h3 className="font-semibold">Componentes:</h3>
              <ul className="list-disc ml-4">
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
              className="w-32 h-32 object-cover"
            />
          )}
          {similar.length > 0 && (
            <div>
              <h2 className="font-semibold mt-4">Productos similares</h2>
              <div className="flex space-x-4 overflow-x-auto">
                {similar.map((p) => (
                  <div key={p.id} className="w-24 text-center">
                    {p.imageUrl && (
                      <img src={p.imageUrl} alt={p.name} className="w-24 h-24 object-cover" />
                    )}
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-sm font-bold">${p.priceARS}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {message && <p className="text-red-500">{message}</p>}
      {(product || message) && (
        <button
          onClick={handleRescan}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded self-start"
        >
          🔄 Escanear otro producto
        </button>
      )}
      <footer className="mt-auto text-center text-xs text-gray-500">
        © Punto Pastelero - www.puntopastelero.com - @puntopastelero
      </footer>
    </div>
  );
}
