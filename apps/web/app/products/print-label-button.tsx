'use client';

interface Props {
  productId: number;
}

export default function PrintLabelButton({ productId }: Props) {
  const handlePrint = async () => {
    const res = await fetch('/api/labels/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId, quantity: 1 }] }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url);
  };
  return (
    <button onClick={handlePrint} className="ml-2 text-blue-500">
      🖨️
    </button>
  );
}
