"use client";

import React from 'react';
import { useAppStore } from '@/lib/store';
import { SchemaPreview } from '@/components/features/SchemaPreview/SchemaPreview';
import { ResultTable } from './ResultTable';
import { ResultChart } from './ResultChart';
import { downloadCsv, slugify } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function ResultPanel() {
  const { file, parseStatus, dbStatus, queryResult, executionTime, userPrompt } = useAppStore();
  const [activeTab, setActiveTab] = React.useState<'table' | 'chart'>('table');

  const showSchema = file && (parseStatus === 'done' || parseStatus === 'parsing') && dbStatus !== 'ready';
  const showResults = dbStatus === 'ready' && queryResult;

  return (
    <div className="flex-1 flex flex-col rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm overflow-hidden">
      {!showSchema && (
        <div className="flex items-center gap-2 mb-6">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M3 5V19a9 3 0 0 0 18 0V5" />
            <path d="M3 12a9 3 0 0 0 18 0" />
          </svg>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Analysis Result</h3>
        </div>
      )}
      
      {showSchema ? (
        <SchemaPreview />
      ) : showResults ? (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M7 16l3-4 3 2 5-6" />
                </svg>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Analysis Result</h3>
              </div>
              
              <div className="flex bg-bg-base/50 p-1 rounded-lg border border-border/50">
                <button 
                  onClick={() => setActiveTab('table')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'table' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Table
                </button>
                <button 
                  onClick={() => setActiveTab('chart')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'chart' ? 'bg-surface text-accent shadow-sm' : 'text-muted hover:text-text'}`}
                >
                  Chart
                </button>
              </div>
            </div>

            <div className="text-right flex items-center gap-4">
              <p className="text-[10px] uppercase font-bold text-muted tracking-widest">
                {queryResult.rowCount.toLocaleString()} rows • {executionTime}ms
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-[10px] border border-border/50"
                onClick={() => {
                  const filename = slugify(userPrompt || 'result') + '-' + new Date().toISOString().split('T')[0];
                  downloadCsv(queryResult.rows, queryResult.columns, filename);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'table' ? <ResultTable /> : <ResultChart />}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
          <div className="h-16 w-16 rounded-full border border-border/50 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M3 5V19a9 3 0 0 0 18 0V5" />
              <path d="M3 12a9 3 0 0 0 18 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text mb-1 italic">No data to display</p>
          <p className="text-xs text-muted max-w-xs">Upload a CSV file or check your engine status to see results.</p>
        </div>
      )}
    </div>
  );
}
