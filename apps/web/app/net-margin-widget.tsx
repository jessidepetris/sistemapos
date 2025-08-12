'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar, Legend } from 'recharts';

function rangeToParams(range: string) {
  const to = new Date();
  let from: Date | null = null;
  if (range === '7d') {
    from = new Date();
    from.setDate(from.getDate() - 6);
  } else if (range === '30d') {
    from = new Date();
    from.setDate(from.getDate() - 29);
  } else if (range === 'ytd') {
    from = new Date(to.getFullYear(), 0, 1);
  }
  const params = new URLSearchParams();
  if (from) params.append('from', from.toISOString().slice(0, 10));
  params.append('to', to.toISOString().slice(0, 10));
  return params;
}

export default function NetMarginWidget() {
  const [range, setRange] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [series, setSeries] = useState<any[]>([]);

  const load = async () => {
    const params = rangeToParams(range);
    const summaryRes = await fetch(`/api/kpis/margin-net?${params.toString()}`);
    setSummary(await summaryRes.json());
    const seriesRes = await fetch(`/api/kpis/margin-net/series?granularity=day&${params.toString()}`);
    setSeries(await seriesRes.json());
  };

  useEffect(() => { load(); }, [range]);

  return (
    <div className="p-4 border rounded space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">Margen Neto</div>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="text-sm border p-1">
          <option value="7d">7d</option>
          <option value="30d">30d</option>
          <option value="ytd">YTD</option>
        </select>
      </div>
      {summary && (
        <div>
          <div className="text-2xl font-semibold">${'{'}summary.netMarginArs.toFixed(2){'}'} ARS</div>
          <div className="text-sm">{summary.netMarginPct.toFixed(2)}%</div>
          <div className="text-xs text-gray-500">
            Ventas: ${'{'}summary.salesGross.toFixed(2){'}'} | COGS: ${'{'}summary.cogs.toFixed(2){'}'} | Comisiones: ${'{'}summary.fees.toFixed(2){'}'}
          </div>
        </div>
      )}
      {series.length > 0 && (
        <LineChart width={300} height={120} data={series} className="mt-2">
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Tooltip />
          <Line type="monotone" dataKey="netMarginArs" stroke="#82ca9d" name="Margen" dot={false} />
          <Line type="monotone" dataKey="salesGross" stroke="#8884d8" name="Ventas" dot={false} />
        </LineChart>
      )}
    </div>
  );
}
