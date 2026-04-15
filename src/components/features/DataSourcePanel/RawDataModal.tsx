"use client";

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { X, Table, Copy, Check, ChevronLeft, ChevronRight, Maximize2, Loader2, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { safeStringify } from '@/lib/utils';

export function RawDataModal() {
  const { 
    isRawDataOpen, 
    closeRawData, 
    rawData, 
    isRawDataLoading,
    rawDataPage,
    rawDataPageSize,
    totalRows,
    setRawDataPage,
    setRawDataPageSize
  } = useAppStore();

  const [copiedRow, setCopiedRow] = useState<number | null>(null);
  const [activeCell, setActiveCell] = useState<{ value: unknown; column: string } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeCell) setActiveCell(null);
        else closeRawData();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeRawData, activeCell]);

  if (!isRawDataOpen) return null;

  const handleCopyRow = (row: Record<string, unknown>, index: number) => {
    navigator.clipboard.writeText(safeStringify(row, 2));
    setCopiedRow(index);
    setTimeout(() => setCopiedRow(null), 2000);
  };

  const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];
  const totalPages = Math.ceil(totalRows / rawDataPageSize);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md" 
        onClick={closeRawData}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-[98vw] h-[96vh] bg-surface/90 border border-border/50 rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-2xl animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-accent/20 text-accent border border-accent/20">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text flex items-center gap-2">
                Browse Data
                <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] uppercase tracking-tighter text-muted border border-white/10">Read Only</span>
              </h2>
              <p className="text-xs text-muted">Direct preview from DuckDB engine &bull; {totalRows.toLocaleString()} total records</p>
            </div>
          </div>
          
          <button 
            onClick={closeRawData}
            className="p-2.5 rounded-full hover:bg-white/10 text-muted hover:text-text transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto custom-scrollbar bg-bg-base/30 relative">
          {isRawDataLoading && (
            <div className="absolute inset-0 z-[30] flex items-center justify-center bg-bg-base/40 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface/80 border border-border shadow-2xl">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <p className="text-sm font-medium text-text">Loading page {rawDataPage + 1}...</p>
              </div>
            </div>
          )}

          {rawData.length === 0 && !isRawDataLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
              <Table className="h-16 w-16 text-muted/20" />
              <p className="text-sm font-medium text-muted">No data found in the dataset</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-separate border-spacing-0 min-w-max">
              <thead className="sticky top-0 z-20">
                <tr className="bg-surface/95 backdrop-blur-md">
                  <th className="px-4 py-4 w-16 text-center text-[10px] font-black uppercase text-muted/40 tracking-widest border-b border-border bg-surface/60">#</th>
                  {columns.map((col) => (
                    <th key={col} className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-[11px] border-b border-border bg-surface/60 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="px-4 py-4 sticky right-0 z-30 bg-surface/95 backdrop-blur-md border-b border-border border-l border-border/50 text-center text-[10px] text-muted/40 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rawData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="px-4 py-3.5 text-center text-[11px] font-mono text-muted/30 border-b border-border/10 bg-white/[0.01]">
                      {rawDataPage * rawDataPageSize + idx + 1}
                    </td>
                    {columns.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      const stringVal = isNull ? 'null' : (typeof val === 'object' ? safeStringify(val) : String(val));
                      const isLong = stringVal.length > 120;
                      
                      return (
                        <td key={col} className="px-6 py-3.5 border-b border-border/10 font-mono text-[12px] max-w-md">
                          <div className="flex items-center gap-2">
                             <span className={`block truncate ${isNull ? 'text-red-400/50 italic' : 'text-text/80'}`}>
                                {isLong ? stringVal.substring(0, 120) + '...' : stringVal}
                             </span>
                             {isLong && (
                               <button 
                                 onClick={() => setActiveCell({ value: val, column: col })}
                                 className="opacity-0 group-hover:opacity-100 p-1 rounded bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all transform active:scale-95"
                                 title="View full content"
                               >
                                 <Maximize2 className="w-3 h-3" />
                               </button>
                             )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3.5 sticky right-0 z-10 bg-surface/90 backdrop-blur-sm border-b border-border/10 border-l border-border/50 group-hover:bg-accent/5 transition-all">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleCopyRow(row, idx)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            copiedRow === idx 
                              ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                              : 'bg-surface border-border/50 text-muted hover:text-accent hover:border-accent/40 shadow-sm'
                          }`}
                          title="Copy row as JSON"
                        >
                          {copiedRow === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* phpMyAdmin Style Pagination Footer */}
        <div className="p-4 border-t border-border/50 bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted uppercase font-bold tracking-wider">Per Page</span>
              <select 
                value={rawDataPageSize}
                onChange={(e) => setRawDataPageSize(Number(e.target.value))}
                className="bg-surface/50 border border-border/50 rounded-lg px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent transition-all cursor-pointer hover:border-accent/40"
              >
                {[25, 50, 100, 250, 500].map(size => (
                  <option key={size} value={size}>{size} rows</option>
                ))}
              </select>
            </div>
            
            <div className="h-4 w-px bg-border/50" />
            
            <div className="text-[11px] text-muted font-medium bg-white/5 py-1 px-3 rounded-full border border-white/5">
              Showing <span className="text-text font-bold">{(rawDataPage * rawDataPageSize + 1).toLocaleString()}</span> to <span className="text-text font-bold">{Math.min((rawDataPage + 1) * rawDataPageSize, totalRows).toLocaleString()}</span> of <span className="text-accent font-black">{totalRows.toLocaleString()}</span> rows
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={rawDataPage === 0 || isRawDataLoading}
              onClick={() => setRawDataPage(0)}
              className="px-2"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={rawDataPage === 0 || isRawDataLoading}
              onClick={() => setRawDataPage(rawDataPage - 1)}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center bg-surface/50 border border-border/50 rounded-lg h-9 px-4 text-xs font-bold text-text">
              <span className="text-muted/50 mr-2">Page</span> {rawDataPage + 1} <span className="text-muted/50 mx-2">of</span> {totalPages}
            </div>

            <Button 
              variant="secondary" 
              size="sm" 
              disabled={rawDataPage >= totalPages - 1 || isRawDataLoading}
              onClick={() => setRawDataPage(rawDataPage + 1)}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={rawDataPage >= totalPages - 1 || isRawDataLoading}
              onClick={() => setRawDataPage(totalPages - 1)}
              className="px-2"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cell Detail Modal */}
      {activeCell && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-200">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveCell(null)} />
           <div className="relative w-full max-w-3xl max-h-[80vh] bg-surface border border-accent/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                   <h3 className="text-sm font-bold text-text uppercase tracking-widest">Detail View: <span className="text-accent">{activeCell.column}</span></h3>
                </div>
                <button 
                  onClick={() => setActiveCell(null)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-muted hover:text-text transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed text-text/90 selection:bg-accent selection:text-white">
                <pre className="whitespace-pre-wrap break-all bg-black/20 p-4 rounded-xl border border-white/5">
                  {typeof activeCell.value === 'object' ? safeStringify(activeCell.value, 2) : String(activeCell.value)}
                </pre>
              </div>
              <div className="p-4 border-t border-border/50 bg-white/[0.02] flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => {
                  navigator.clipboard.writeText(typeof activeCell.value === 'object' ? safeStringify(activeCell.value, 2) : String(activeCell.value));
                }}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
                <Button variant="primary" size="sm" onClick={() => setActiveCell(null)}>Close</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
