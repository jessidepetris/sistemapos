import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import PrintLabelButton from './print-label-button';

async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { cache: 'no-store' });
  return res.json();
}

export default async function ProductsPage() {
  const [products, session] = await Promise.all([
    getProducts(),
    getServerSession(authOptions),
  ]);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Products</h1>
        {session?.user.role === 'ADMIN' && (
          <Link href="/products/new" className="bg-blue-500 text-white px-2 py-1">
            New
          </Link>
        )}
      </div>
      <ul>
        {products.map((p: any) => (
          <li key={p.id} className="mb-2 flex items-center">
            <span>
              {p.name} {p.isComposite && <span className="text-xs bg-gray-200 px-1 rounded">KIT</span>} - {p.category} - ${p.priceARS} (stock: {p.stock})
            </span>
            <PrintLabelButton productId={p.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
