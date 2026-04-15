import React, { useMemo, useState, useEffect } from 'react';
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
import { Select } from '@/components/ui/Select';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#fb7185', '#fda4af'];

export function ResultChart() {
  const { queryResult, schema, userPrompt } = useAppStore();

  const [manualType, setManualType] = useState<'bar' | 'line' | 'pie' | null>(null);
  const [manualX, setManualX] = useState<string | null>(null);
  const [manualY, setManualY] = useState<string | null>(null);

  useEffect(() => {
    setManualType(null);
    setManualX(null);
    setManualY(null);
  }, [queryResult]);

  const chartInfo = useMemo(() => {
    if (!queryResult) return null;

    const cols = queryResult.columns.map(name => {
      const sCol = schema.find(s => s.name === name);
      return { name, type: sCol?.type || 'string' };
    });

    const stringCols = cols.filter(c => c.type === 'string');
    const numberCols = cols.filter(c => c.type === 'number');
    const dateCols = cols.filter(c => c.type === 'date');

    let type: 'bar' | 'line' | 'pie' = 'bar';
    let xKey = cols[0]?.name || '';
    let yKey = numberCols[0]?.name || cols[1]?.name || '';

    if (dateCols.length > 0 && numberCols.length > 0) {
      type = 'line';
      xKey = dateCols[0].name;
      yKey = numberCols[0].name;
    } else if (stringCols.length > 0 && numberCols.length > 0) {
      if (((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0) <= 8) {
        type = 'pie';
      } else {
        type = 'bar';
      }
      xKey = stringCols[0].name;
      yKey = numberCols[0].name;
    }

    return { type, xKey, yKey, data: queryResult.rows, cols };
  }, [queryResult, schema]);

  if (!chartInfo) return null;

  const activeType = manualType || chartInfo.type;
  const activeX = manualX || chartInfo.xKey;
  const activeY = manualY || chartInfo.yKey;
  const data = chartInfo.data;

  const truncate = (str: string, n: number) => (str.length > n ? str.slice(0, n - 1) + '…' : str);

  const renderChart = () => {
    switch (activeType) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3149" vertical={false} />
            <XAxis 
              dataKey={activeX} 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#94a3b8' }}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} tick={{ fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }} 
              itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: '600' }}
              labelStyle={{ color: '#f1f5f9', marginBottom: '4px', fontWeight: 'bold' }}
              cursor={{ stroke: '#2d3149', strokeWidth: 1 }}
            />
            <Line type="monotone" dataKey={activeY} stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={activeY}
              nameKey={activeX}
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
            <Tooltip contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '8px' }} />
          </PieChart>
        );
      case 'bar':
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3149" vertical={false} />
            <XAxis 
              dataKey={activeX} 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => v.toLocaleString()} tick={{ fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1d27', border: '1px solid #2d3149', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)' }} 
              itemStyle={{ color: '#6366f1', fontSize: '12px', fontWeight: '600' }}
              labelStyle={{ color: '#f1f5f9', marginBottom: '4px', fontWeight: 'bold' }}
              cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
            />
            <Bar dataKey={activeY} fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[400px] p-4 bg-surface/20 rounded-xl border border-border/30 gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
        <h3 className="text-sm font-medium text-text truncate" title={userPrompt}>
          {userPrompt ? truncate(userPrompt, 60) : 'Query Result'}
        </h3>
        <div className="flex items-center gap-2">
          <Select 
            value={activeType} 
            onChange={(e) => setManualType(e.target.value as 'bar' | 'line' | 'pie')}
            className="w-[120px] h-8 text-xs font-semibold !pl-2"
          >
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </Select>
          
          <Select 
            value={activeX} 
            onChange={(e) => setManualX(e.target.value)}
            className="w-[120px] h-8 text-xs !pl-2"
          >
            {chartInfo.cols.map(c => <option key={`x-${c.name}`} value={c.name}>X: {c.name}</option>)}
          </Select>

          <Select 
            value={activeY} 
            onChange={(e) => setManualY(e.target.value)}
            className="w-[124px] h-8 text-xs !pl-2"
          >
            {chartInfo.cols.map(c => <option key={`y-${c.name}`} value={c.name}>Y: {c.name}</option>)}
          </Select>
        </div>
      </div>
      <div className="flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
