'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTable } from 'react-table';

const TYPES = [
  'ALL',
  'PURCHASE_RECEIPT',
  'SALE_COGS',
  'RETURN_SALE',
  'RETURN_PURCHASE',
  'ADJUSTMENT',
  'PACKAGING_CONSUME',
  'KIT_SALE_CONSUME',
  'MERMA',
  'REVALUATION',
];

export default function KardexPage() {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (type !== 'ALL') params.append('type', type);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    params.append('page', String(page));
    const res = await fetch(`/api/reports/kardex?${params.toString()}`);
    setData(await res.json());
  };

  useEffect(() => { fetchData(); }, [page]);

  const columns = useMemo(
    () => [
      { Header: 'Fecha', accessor: 'createdAt' },
      { Header: 'Producto', accessor: 'productName' },
      { Header: 'Tipo', accessor: 'type' },
      { Header: 'Qty', accessor: 'qty' },
      { Header: 'Costo unit', accessor: 'unitCostArs' },
      { Header: 'Costo total', accessor: 'totalCostArs' },
      { Header: 'Ref', accessor: (row: any) => (row.refId ? `${row.refTable}:${row.refId}` : '') },
      { Header: 'Notas', accessor: 'notes' },
    ],
    [],
  );
  const table = useTable({ columns, data: data?.rows || [] });

  const exportExcel = () => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (type !== 'ALL') params.append('type', type);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    window.location.href = `/api/reports/kardex/export?${params.toString()}`;
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Kardex</h1>
      <div className="flex gap-2 items-end flex-wrap">
        <input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="Producto ID" className="border p-1" />
        <select value={type} onChange={(e) => setType(e.target.value)} className="border p-1">
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-1" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-1" />
        <button onClick={() => { setPage(1); fetchData(); }} className="px-2 py-1 bg-blue-500 text-white">Filtrar</button>
        <button onClick={exportExcel} className="px-2 py-1 bg-green-500 text-white">Excel</button>
      </div>
      <table {...table.getTableProps()} className="min-w-full text-sm">
        <thead>
          {table.headerGroups.map((hg) => (
            <tr {...hg.getHeaderGroupProps()} key={hg.id}>
              {hg.headers.map((col) => (
                <th {...col.getHeaderProps()} key={col.id} className="text-left">
                  {col.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...table.getTableBodyProps()}>
          {table.rows.map((row) => {
            table.prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id} className={row.values.qty > 0 ? 'bg-green-50' : 'bg-red-50'}>
                {row.cells.map((cell) => (
                  <td {...cell.getCellProps()} key={cell.column.id}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data && (
        <div className="text-sm">
          Totales — Ingreso: {data.totals.qtyIn} ({data.totals.costIn} ARS) |
          Egreso: {data.totals.qtyOut} ({data.totals.costOut} ARS)
        </div>
      )}
    </div>
  );
}
