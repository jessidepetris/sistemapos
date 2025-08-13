'use client';

import { useEffect, useState } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import toast from 'react-hot-toast';

const actionOptions = [
  'LOGIN',
  'CREACION',
  'EDICION',
  'ELIMINACION',
  'EXPORTACION',
  'IMPRESION',
  'CAMBIO_ESTADO',
  'IMPORTACION',
  'BACKUP',
  'RESTAURACION',
  'FACTURACION',
  'ETIQUETA',
];

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    userEmail: '',
    actionType: '',
    entity: '',
    from: '',
    to: '',
  });

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v as string);
      });
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar');
      const data = await res.json();
      setLogs(data);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const columns = [
    { Header: 'Fecha', accessor: (row: any) => new Date(row.ts).toLocaleString() },
    { Header: 'Usuario', accessor: 'userEmail' },
    { Header: 'Acción', accessor: 'actionType' },
    { Header: 'Entidad', accessor: 'entity' },
    { Header: 'ID', accessor: 'entityId' },
    { Header: 'Detalles', accessor: 'details' },
  ];

  const tableInstance = useTable({ columns, data: logs }, useSortBy, usePagination);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    state: { pageIndex },
  } = tableInstance as any;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Auditoría</h1>
      <form
        className="flex flex-wrap gap-2 mb-4"
        onSubmit={(e) => {
          e.preventDefault();
          fetchLogs();
        }}
      >
        <input
          className="border px-2 py-1"
          placeholder="Usuario"
          value={filters.userEmail}
          onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
        />
        <select
          className="border px-2 py-1"
          value={filters.actionType}
          onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
        >
          <option value="">Acción</option>
          {actionOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <input
          className="border px-2 py-1"
          placeholder="Entidad"
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
        />
        <input
          type="date"
          className="border px-2 py-1"
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
        />
        <input
          type="date"
          className="border px-2 py-1"
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
          Filtrar
        </button>
      </form>
      <table {...getTableProps()} className="min-w-full text-sm">
        <thead>
          {headerGroups.map((headerGroup: any) => (
            <tr {...headerGroup.getHeaderGroupProps()} key={headerGroup.id}>
              {headerGroup.headers.map((column: any) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={column.id}
                  className="px-2 py-1 text-left"
                >
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row: any) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={row.id} className="border-t">
                {row.cells.map((cell: any) => (
                  <td {...cell.getCellProps()} className="px-2 py-1" key={cell.column.id}>
                    {cell.render('Cell')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex gap-2 mt-2">
        <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-2 py-1 border rounded">
          {'<'}
        </button>
        <span>Página {pageIndex + 1}</span>
        <button onClick={() => nextPage()} disabled={!canNextPage} className="px-2 py-1 border rounded">
          {'>'}
        </button>
      </div>
    </div>
  );
}
