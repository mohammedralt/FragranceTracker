'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { PriceSnapshot } from '@/lib/types';

interface RawPoint extends PriceSnapshot {
  retailer_name: string;
  retailer_key: string;
}

interface PriceHistoryChartProps {
  data: RawPoint[];
}

const COLORS = [
  '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#6366f1',
];

export function PriceHistoryChart({ data }: PriceHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No price history yet.
      </div>
    );
  }

  // Build a map: retailer_key → { date → price }
  const retailers = Array.from(new Set(data.map((d) => d.retailer_key)));
  const byDate = new Map<string, Record<string, number>>();

  for (const point of data) {
    const date = new Date(point.scraped_at).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
    if (!byDate.has(date)) byDate.set(date, {});
    byDate.get(date)![point.retailer_key] = point.price;
  }

  const chartData = Array.from(byDate.entries()).map(([date, prices]) => ({
    date,
    ...prices,
  }));

  const retailerNames = Object.fromEntries(
    data.map((d) => [d.retailer_key, d.retailer_name])
  );

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.6 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--tooltip-bg, #1f2937)',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number, key: string) => [
            `$${value.toFixed(2)}`,
            retailerNames[key] ?? key,
          ]}
        />
        <Legend
          formatter={(key) => retailerNames[key] ?? key}
          wrapperStyle={{ fontSize: '12px' }}
        />
        {retailers.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
