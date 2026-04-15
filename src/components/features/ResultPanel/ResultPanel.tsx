import React from 'react';
import { useAppStore } from '@/lib/store';
import { SchemaPreview } from '@/components/features/SchemaPreview/SchemaPreview';
import { ResultTable } from './ResultTable';
import { ResultChart } from './ResultChart';
import { Button } from '@/components/ui/Button';

export function ResultPanel() {
  const { file, parseStatus, dbStatus, queryResult, executionTime } = useAppStore();
  const [activeTab, setActiveTab] = React.useState<'table' | 'chart'>('table');

  const showSchema = file && (parseStatus === 'parsing' || (parseStatus === 'done' && dbStatus !== 'ready'));
  const showResults = dbStatus === 'ready' && queryResult;
  const isReady = dbStatus === 'ready' && !queryResult;

  return (
    <div className="flex-1 flex flex-col rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm overflow-hidden">
      {!showSchema && !showResults && !isReady && (
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

            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase font-bold text-muted tracking-widest mr-2">
                {((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0).toLocaleString()} rows • {executionTime}ms
              </p>
              
              <div className="flex items-center bg-bg-base/30 rounded-lg p-0.5 border border-border/50">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] hover:text-accent"
                  onClick={() => useAppStore.getState().exportQueryResult('csv')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1 opacity-70">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  CSV
                </Button>
                
                <div className="w-[1px] h-3 bg-border/50 mx-0.5" />

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] hover:text-accent"
                  onClick={() => useAppStore.getState().exportQueryResult('parquet')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1 opacity-70">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 12 15 15" />
                  </svg>
                  PARQUET
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {activeTab === 'table' ? <ResultTable /> : <ResultChart />}
          </div>
        </div>
      ) : isReady ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="h-20 w-20 rounded-3xl bg-accent/10 flex items-center justify-center mb-6 shadow-2xl shadow-accent/20 animate-in zoom-in-95 duration-500">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold text-text mb-2">Engine is Ready</h4>
          <p className="text-sm text-muted max-w-sm leading-relaxed px-6">
            Your dataset has been indexed and is ready for analysis. 
            <span className="block mt-2 font-medium text-accent/80">Try asking a question in the query panel above.</span>
          </p>
          <div className="mt-8 flex gap-3">
             <div className="px-3 py-1.5 rounded-full bg-surface border border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted">
               @ Mention columns
             </div>
             <div className="px-3 py-1.5 rounded-full bg-surface border border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted">
               Auto-Charts
             </div>
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
