"use client";

import React, { useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { inferColumnType } from '@/lib/inferType';
import type { CsvColumn } from '@/lib/types';

export function DataSourcePanel() {
  const { setFile, setSchema, setTotalRows, setParseStatus, parseStatus, parseError } = useAppStore();
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
        const { schema, previewData, totalRows } = payload;
        
        // Infer column types
        const inferredSchema: CsvColumn[] = schema.map((name: string) => {
          const rawValues = (previewData as Record<string, unknown>[])
            .map((row) => row[name])
            .filter((v) => v !== undefined && v !== null);
          
          const sampleValues = rawValues.map(String);
          
          return {
            name,
            type: inferColumnType(sampleValues),
            sampleValues: sampleValues.slice(0, 3)
          };
        });

        setSchema(inferredSchema);
        setTotalRows(totalRows);
        setParseStatus('done');
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

  return (
    <div className="flex flex-col h-full rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
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
          <div className="flex flex-col items-center animate-pulse">
            <div className="h-10 w-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-text">Parsing CSV...</p>
            <p className="text-xs text-muted mt-1">This might take a moment for large files</p>
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
            <p className="text-sm font-medium text-text mb-1">
              {isDragging ? 'Drop it here!' : 'Click to upload CSV'}
            </p>
            <p className="text-xs text-muted">Up to 2GB, processed locally</p>
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
