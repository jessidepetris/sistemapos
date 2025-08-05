'use client';
import { useMemo, useState } from 'react';
import { useTable } from 'react-table';

export default function VentasReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<any>(null);

  const dataTable = useMemo(
    () =>
      report
        ? Object.entries(report.byClient).map(([client, total]) => ({
            client,
            total,
          }))
        : [],
    [report],
  );
  const columns = useMemo(
    () => [
      { Header: 'Cliente', accessor: 'client' },
      { Header: 'Total', accessor: 'total' },
    ],
    [],
  );
  const table = useTable({ columns, data: dataTable });

  const fetchReport = async () => {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const res = await fetch(`/api/reports/sales?${params.toString()}`);
    if (res.headers.get('content-type')?.includes('application/json')) {
      setReport(await res.json());
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Informe de Ventas</h1>
      <div className="flex gap-2">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-1" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-1" />
        <button onClick={fetchReport} className="px-2 py-1 bg-blue-500 text-white">Filtrar</button>
        {report && (
          <>
            <a href={`/api/reports/sales?${new URLSearchParams({ from, to, format: 'excel' }).toString()}`} className="px-2 py-1 bg-green-500 text-white">Excel</a>
            <a href={`/api/reports/sales?${new URLSearchParams({ from, to, format: 'pdf' }).toString()}`} className="px-2 py-1 bg-red-500 text-white">PDF</a>
          </>
        )}
      </div>
      {report && (
        <div className="space-y-4">
          <div>
            <h2 className="font-semibold">Totales por Cliente</h2>
            <table {...table.getTableProps()} className="min-w-full text-sm">
              <thead>
                {table.headerGroups.map((hg) => (
                  <tr {...hg.getHeaderGroupProps()} key={hg.id}>
                    {hg.headers.map((col) => (
                      <th {...col.getHeaderProps()} className="text-left" key={col.id}>
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
                    <tr {...row.getRowProps()} key={row.id}>
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
          </div>
        </div>
      )}
    </div>
  );
}
