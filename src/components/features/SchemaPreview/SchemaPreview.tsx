"use client";

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import type { ColumnType } from '@/lib/types';

export function SchemaPreview() {
  const { 
    schema, 
    totalRows, 
    fileName, 
    fileSizeBytes, 
    updateColumnType, 
    resetCsv,
    initDB,
    dbStatus,
    dbError
  } = useAppStore();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{fileName}</h2>
          <p className="text-xs text-muted">
            {totalRows.toLocaleString()} rows • {formatFileSize(fileSizeBytes)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={resetCsv} className="text-red-400 hover:text-red-300">
          Replace File
        </Button>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-bg-base/30">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface/50 sticky top-0 z-10">
              <th className="px-4 py-3 font-semibold text-muted">Column Name</th>
              <th className="px-4 py-3 font-semibold text-muted">Type</th>
              <th className="px-4 py-3 font-semibold text-muted">Sample Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 font-mono">
            {schema.map((col) => (
              <tr key={col.name} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-white">{col.name}</td>
                <td className="px-4 py-3">
                  <Select
                    value={col.type}
                    onChange={(e) => updateColumnType(col.name, e.target.value as ColumnType)}
                    className="h-8 text-xs bg-surface/50 border-none hover:bg-surface"
                  >
                    <option value="string">🔤 string</option>
                    <option value="number">🔢 number</option>
                    <option value="date">📅 date</option>
                    <option value="boolean">🔘 boolean</option>
                  </Select>
                </td>
                <td className="px-4 py-3 space-x-2">
                  {col.sampleValues.map((val, idx) => (
                    <Badge key={idx} variant="default" className="bg-white/5 border-none text-[10px]">
                      {val.length > 20 ? val.substring(0, 20) + '...' : val}
                    </Badge>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {dbError && (
          <p className="text-xs text-red-400 text-right">{dbError}</p>
        )}
        <div className="flex justify-end">
          <Button 
            className="px-8 shadow-lg shadow-accent/20"
            onClick={initDB}
            disabled={dbStatus === 'loading' || dbStatus === 'ready'}
          >
            {dbStatus === 'loading' ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading Engine...
              </span>
            ) : dbStatus === 'ready' ? (
              '✅ Engine Ready'
            ) : (
              'Confirm Schema & Proceed'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
