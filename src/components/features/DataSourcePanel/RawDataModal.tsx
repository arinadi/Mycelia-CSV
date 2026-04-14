"use client";

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Table, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { safeStringify } from '@/lib/utils';

export function RawDataModal() {
  // Explicitly invoking the store hook to resolve reported ReferenceError
  const { isRawDataOpen, closeRawData, rawData } = useAppStore();
  const [copiedRow, setCopiedRow] = React.useState<number | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRawData();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeRawData]);

  if (!isRawDataOpen) return null;

  const handleCopyRow = (row: Record<string, unknown>, index: number) => {
    navigator.clipboard.writeText(safeStringify(row, 2));
    setCopiedRow(index);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={closeRawData}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[96vw] h-[94vh] bg-surface/90 border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/20 text-accent">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text">Raw Data Inspection</h2>
              <p className="text-xs text-muted">Previewing first 100 rows directly from DuckDB</p>
            </div>
          </div>
          
          <button 
            onClick={closeRawData}
            className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-text transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-bg-base/30">
          {rawData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
              <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-muted">Fetching raw data...</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-max">
              <thead className="sticky top-0 z-20">
                <tr className="bg-surface/95 backdrop-blur-md border-b border-border shadow-sm">
                  <th className="px-4 py-4 w-12 text-center text-[10px] font-black uppercase text-muted/50 tracking-widest bg-surface/80">#</th>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-[11px] bg-surface/80">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-4 sticky right-0 bg-surface/90 backdrop-blur-md border-l border-border/50 shadow-[-4px_0_12px_rgba(0,0,0,0.2)]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {rawData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-4 py-3 text-center text-[10px] font-mono text-muted/40">{idx + 1}</td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      const displayVal = isNull ? 'null' : (typeof val === 'object' ? safeStringify(val) : String(val));
                      
                      return (
                        <td key={col} className="px-6 py-3 font-mono text-[12px] max-w-md truncate">
                          <span className={isNull ? 'text-red-400/50 italic' : 'text-text/80'}>
                            {displayVal}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 sticky right-0 bg-surface/90 backdrop-blur-sm border-l border-border/50 group-hover:bg-accent/5 transition-all">
                      <button
                        onClick={() => handleCopyRow(row, idx)}
                        className="p-1.5 rounded-lg bg-surface border border-border/50 text-muted hover:text-accent hover:border-accent/40 shadow-sm transition-all"
                        title="Copy row as JSON"
                      >
                        {copiedRow === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 bg-white/[0.01] flex items-center justify-between">
          <p className="text-[10px] text-muted uppercase tracking-widest font-medium">
            Showing {rawData.length} of actual dataset rows
          </p>
          <div className="flex items-center gap-4">
             <span className="text-[10px] text-muted italic">Press Esc to close</span>
             <Button variant="secondary" size="sm" onClick={closeRawData}>Done</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
