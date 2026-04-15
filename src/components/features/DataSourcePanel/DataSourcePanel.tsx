"use client";

import React, { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { inferColumnType, detectColumnFormat } from '@/lib/inferType';
import type { CsvColumn, ColumnType } from '@/lib/types';
import { 
  Type, 
  Hash, 
  Calendar, 
  CheckCircle2, 
  Play, 
  CheckCircle, 
  AlertCircle,
  RotateCcw,
  Layers,
  FileJson,
  Eye
} from 'lucide-react';

export function DataSourcePanel() {
  const { 
    setFile, 
    schema,
    setSchema, 
    totalRows,
    setTotalRows, 
    parseStatus, 
    setParseStatus, 
    setSampleRows, 
    parseError,
    dbStatus,
    dbError,
    initDB,
    updateColumnType,
    resetCsv
  } = useAppStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file.');
      return;
    }

    setFile(file);
    setParseStatus('parsing');

    const worker = new Worker(new URL('@/workers/csv-parser.worker.ts', import.meta.url));
    
    worker.postMessage({ file });

    worker.onmessage = (event) => {
      const { type, payload } = event.data;

      if (type === 'done') {
        const { schema: rawSchema, previewData, totalRows } = payload;
        
        // Infer column types
        const inferredSchema: CsvColumn[] = rawSchema.map((name: string) => {
          const rawValues = (previewData as Record<string, unknown>[])
            .map((row) => row[name])
            .filter((v) => v !== undefined && v !== null);
          
          const sampleValues = rawValues.map(String);
          const type = inferColumnType(sampleValues);
          
          return {
            name,
            type,
            format: type === 'string' ? detectColumnFormat(sampleValues) : 'text',
            sampleValues: sampleValues.slice(0, 3)
          };
        });

        setSchema(inferredSchema);
        setTotalRows(totalRows);
        setSampleRows(previewData.slice(0, 5));
        
        // AUTOMATION: Trigger initial DB load immediately
        // Note: fetchMetadata inside initDB will refine these results
        initDB();

        worker.terminate();
      } else if (type === 'error') {
        setParseStatus('error', payload);
        worker.terminate();
      }
    };

    worker.onerror = (err) => {
      setParseStatus('error', err.message);
      worker.terminate();
    };
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Schema Preview & Initialization State
  if (parseStatus === 'done') {
    return (
      <div className="flex flex-col h-full rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-accent">
            <CheckCircle className="w-5 h-5" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Schema Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => useAppStore.getState().openRawData()}
              className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-accent transition-all flex items-center gap-2 group"
              title="Inspect Raw Data"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest hidden group-hover:inline transition-all">Inspect</span>
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={resetCsv}
              className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-accent transition-all"
              title="Reset dataset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 pr-2">
          {schema.length > 0 ? (
            <div className="space-y-2">
              {schema.map((col) => (
                <div key={col.name} className="flex items-center justify-between p-3 rounded-xl bg-bg-base/30 border border-border/30 group hover:border-accent/40 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-surface flex-shrink-0 relative">
                      {col.format === 'json' ? (
                        <FileJson className="w-4 h-4 text-emerald-400" />
                      ) : col.format === 'serialized' ? (
                        <Layers className="w-4 h-4 text-amber-400" />
                      ) : col.name.toLowerCase().includes('date') || col.type === 'date' ? (
                        <Calendar className="w-4 h-4 text-accent" />
                      ) : col.type === 'number' ? (
                        <Hash className="w-4 h-4 text-accent" />
                      ) : col.type === 'boolean' ? (
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      ) : (
                        <Type className="w-4 h-4 text-accent" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                         <span className="text-sm font-medium text-text truncate">{col.name}</span>
                         {col.format === 'json' && (
                           <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 tracking-tighter uppercase">JSON</span>
                         )}
                         {col.format === 'serialized' && (
                           <span className="text-[8px] font-black bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20 tracking-tighter uppercase">SRLZD</span>
                         )}
                      </div>
                      <span className="text-[10px] text-muted truncate">
                        {col.sampleValues.length > 0 ? col.sampleValues.join(', ') : 'No sample data'}
                      </span>
                    </div>
                  </div>
                  
                  <select 
                    value={col.type} 
                    onChange={(e) => updateColumnType(col.name, e.target.value as ColumnType)}
                    className="bg-surface border border-border/50 rounded-lg text-[10px] font-bold uppercase p-1.5 text-accent focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer appearance-none px-4"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
               <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center animate-pulse">
                 <Layers className="w-6 h-6 text-accent" />
               </div>
               <div>
                 <p className="text-sm font-bold text-text mb-1">Analyzing Schema...</p>
                 <p className="text-xs text-muted">The engine is identifying columns and types in your large dataset.</p>
               </div>
            </div>
          )}
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Total Rows</span>
            <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
              {totalRows.toLocaleString()}
            </span>
          </div>
          
          <button
            onClick={initDB}
            disabled={dbStatus === 'loading' || dbStatus === 'ready'}
            className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg ${
              dbStatus === 'ready' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                : 'bg-accent text-emerald-950 hover:scale-[1.02] hover:shadow-accent/20 active:scale-[0.98]'
            } ${dbStatus === 'loading' && 'opacity-70 pointer-events-none'}`}
          >
            {dbStatus === 'loading' ? (
              <>
                <div className="h-4 w-4 border-2 border-emerald-950/30 border-t-emerald-950 rounded-full animate-spin" />
                Initializing...
              </>
            ) : dbStatus === 'ready' ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Ready to Analyze
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Analysis
              </>
            )}
          </button>
          
          {dbError && (
            <div className="p-3 rounded-lg bg-red-400/10 border border-red-400/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-[10px] text-red-400 leading-normal">{dbError}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6 text-accent">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Data Source</h3>
      </div>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-bg-base/30 transition-all cursor-pointer group relative overflow-hidden ${
          isDragging ? 'border-accent bg-accent/5' : 'border-border-dashed hover:bg-bg-base/50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onFileChange} 
          accept=".csv"
          className="hidden"
        />

        {parseStatus === 'parsing' ? (
          <div className="flex flex-col items-center py-8" aria-live="polite">
            <div className="h-12 w-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-accent/20" />
            <p className="text-base font-bold text-text mb-1">Processing Dataset...</p>
            <p className="text-xs text-muted text-center max-w-[200px] leading-relaxed px-4">
              Analyzing schema and indexing records for high-speed local queries.
            </p>
          </div>
        ) : (
          <>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-4 transition-transform ${
              isDragging ? 'bg-accent/20 scale-110' : 'bg-accent/10 group-hover:scale-110'
            }`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium text-text mb-1 group-hover:text-accent transition-colors">
              {isDragging ? 'Drop it here!' : 'Click to upload CSV'}
            </p>
            <p className="text-xs text-muted">Up to 2GB · 100% Local Inference</p>
          </>
        )}

        {parseError && (
          <p className="absolute bottom-4 text-xs text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
            Error: {parseError}
          </p>
        )}
      </div>
    </div>
  );
}
