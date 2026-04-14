"use client";

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '@/lib/store';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fda4af'];

export function ResultChart() {
  const { queryResult, schema } = useAppStore();

  const chartData = useMemo(() => {
    if (!queryResult) return null;

    // Detect column types
    const columns = queryResult.columns.map(name => {
      const sCol = schema.find(s => s.name === name);
      return { name, type: sCol?.type || 'string' };
    });

    const stringCols = columns.filter(c => c.type === 'string');
    const numberCols = columns.filter(c => c.type === 'number');
    const dateCols = columns.filter(c => c.type === 'date');

    let type: 'bar' | 'line' | 'pie' = 'bar';
    let xKey = columns[0].name;
    let yKey = numberCols[0]?.name || columns[1]?.name;

    if (dateCols.length > 0 && numberCols.length > 0) {
      type = 'line';
      xKey = dateCols[0].name;
      yKey = numberCols[0].name;
    } else if (stringCols.length > 0 && numberCols.length > 0) {
      if (queryResult.rowCount <= 8) {
        type = 'pie';
      } else {
        type = 'bar';
      }
      xKey = stringCols[0].name;
      yKey = numberCols[0].name;
    }

    return { type, xKey, yKey, data: queryResult.rows };
  }, [queryResult, schema]);

  if (!chartData) return null;

  const renderChart = () => {
    const { type, xKey, yKey, data } = chartData;

    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3149" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '8px' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '8px' }}
            />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3149" vertical={false} />
            <XAxis 
              dataKey={xKey} 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '8px' }}
              itemStyle={{ color: '#6366f1' }}
            />
            <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-[300px] p-4 bg-surface/20 rounded-xl border border-border/30">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
