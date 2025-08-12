'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function DashboardFinanciero() {
  const [salesSeries, setSalesSeries] = useState<any[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesDelta, setSalesDelta] = useState(0);
  const [marginSeries, setMarginSeries] = useState<any[]>([]);
  const [marginTotal, setMarginTotal] = useState(0);
  const [ticketAvg, setTicketAvg] = useState(0);
  const [mix, setMix] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [receivables, setReceivables] = useState(0);

  useEffect(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    const params = `from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`;
    fetch(`/api/kpis/sales?granularity=daily&${params}`)
      .then((r) => r.json())
      .then((d) => {
        setSalesTotal(d.total);
        setSalesDelta(d.delta);
        setSalesSeries(
          Object.entries(d.series).map(([date, total]: any) => ({ date, sales: total }))
        );
      });
    fetch(`/api/kpis/margin?granularity=daily&${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMarginTotal(d.total);
        setMarginSeries(
          Object.entries(d.series).map(([date, total]: any) => ({ date, margin: total }))
        );
      });
    fetch(`/api/kpis/ticket-avg?${params}`)
      .then((r) => r.json())
      .then((d) => setTicketAvg(d.average));
    fetch(`/api/kpis/payments-mix?${params}`)
      .then((r) => r.json())
      .then(setMix);
    fetch(`/api/kpis/top-products?metric=sales&limit=5&${params}`)
      .then((r) => r.json())
      .then(setTopProducts);
    fetch(`/api/kpis/top-clients?metric=sales&limit=5&${params}`)
      .then((r) => r.json())
      .then(setTopClients);
    fetch(`/api/kpis/receivables?aging=30,60,90`)
      .then((r) => r.json())
      .then((d) => setReceivables(d.reduce((sum: number, c: any) => sum + c.balance, 0)));
  }, []);

  const lineData = salesSeries.map((s) => {
    const m = marginSeries.find((ms) => ms.date === s.date);
    return { date: s.date, sales: s.sales, margin: m ? m.margin : 0 };
  });

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard Financiero</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Ventas 30d</div>
          <div className="text-2xl font-semibold">${'{'}salesTotal.toFixed(2){'}'}</div>
          <div className={salesDelta >= 0 ? 'text-green-600' : 'text-red-600'}>
            {salesDelta >= 0 ? '▲' : '▼'} {Math.abs(salesDelta).toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Margen 30d</div>
          <div className="text-2xl font-semibold">${'{'}marginTotal.toFixed(2){'}'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Ticket promedio</div>
          <div className="text-2xl font-semibold">${'{'}ticketAvg.toFixed(2){'}'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Deuda clientes</div>
          <div className="text-2xl font-semibold">${'{'}receivables.toFixed(2){'}'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LineChart width={500} height={300} data={lineData}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Ventas" />
          <Line type="monotone" dataKey="margin" stroke="#82ca9d" name="Margen" />
        </LineChart>

        <PieChart width={400} height={300}>
          <Pie data={mix} dataKey="percent" nameKey="method" cx="50%" cy="50%" outerRadius={100} label>
            {mix.map((_, index) => (
              <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <BarChart width={500} height={300} data={topProducts}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#8884d8" />
        </BarChart>

        <BarChart width={500} height={300} data={topClients}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#82ca9d" />
        </BarChart>
      </div>
    </div>
  );
}
