import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

interface ChartProps {
  data: any;
}

export function BarChart({ data }: ChartProps) {
  // Si no hay datos o no tienen el formato correcto, mostramos un gráfico vacío
  if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex justify-center items-center h-full w-full text-muted-foreground">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data.labels.map((label: string, i: number) => ({
          name: label,
          value: data.datasets[0].data[i],
        }))}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="value"
          fill={data.datasets[0].backgroundColor}
          name={data.datasets[0].label}
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

export function PieChart({ data }: ChartProps) {
  // Si no hay datos o no tienen el formato correcto, mostramos un gráfico vacío
  if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex justify-center items-center h-full w-full text-muted-foreground">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data.labels.map((label: string, i: number) => ({
            name: label,
            value: data.datasets[0].data[i],
          }))}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
        >
          {data.labels.map((_: any, index: number) => (
            <Cell
              key={`cell-${index}`}
              fill={data.datasets[0].backgroundColor[index % data.datasets[0].backgroundColor.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export function LineChart({ data }: ChartProps) {
  // Si no hay datos o no tienen el formato correcto, mostramos un gráfico vacío
  if (!data || !data.labels || !data.datasets || !data.datasets[0]) {
    return (
      <div className="flex justify-center items-center h-full w-full text-muted-foreground">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data.labels.map((label: string, i: number) => ({
          name: label,
          value: data.datasets[0].data[i],
        }))}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={data.datasets[0].borderColor}
          activeDot={{ r: 8 }}
          name={data.datasets[0].label}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
