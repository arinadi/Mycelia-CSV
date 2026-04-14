"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';

export function QueryPanel() {
  const { 
    userPrompt, 
    setUserPrompt, 
    runAiQuery, 
    generatedSql, 
    setGeneratedSql,
    isAnalyzing, 
    executeSql,
    dbStatus,
    queryError
  } = useAppStore();

  const [isEditingSql, setIsEditingSql] = useState(false);

  const handleRunAi = async () => {
    if (!userPrompt.trim()) return;
    await runAiQuery();
    setIsEditingSql(false);
  };

  const handleExecute = async () => {
    if (!generatedSql.trim()) return;
    
    // Destructive SQL guard
    const BLOCKED = /^\s*(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|TRUNCATE)/i;
    if (BLOCKED.test(generatedSql)) {
      alert('Only SELECT queries are allowed for security.');
      return;
    }

    await executeSql(generatedSql);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Natural Language Query</h3>
        </div>
        {dbStatus !== 'ready' && (
          <Badge variant="danger" className="text-[10px]">Engine Not Ready</Badge>
        )}
      </div>
      
      <div className="relative mb-6">
        <textarea
          className="w-full h-24 rounded-xl bg-bg-base/50 border border-border/50 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none transition-all"
          placeholder="e.g. Total sales per region, sorted by highest..."
          value={userPrompt}
          onChange={(e) => setUserPrompt(e.target.value)}
          disabled={isAnalyzing}
        />
        <Button 
          className="absolute bottom-4 right-4 rounded-full h-10 w-10 p-0 flex items-center justify-center shadow-lg shadow-accent/20"
          variant="primary"
          disabled={isAnalyzing || !userPrompt.trim()}
          onClick={handleRunAi}
        >
          {isAnalyzing ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </Button>
      </div>

      {generatedSql && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-muted uppercase tracking-widest">Generated SQL</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px]"
              onClick={() => setIsEditingSql(!isEditingSql)}
            >
              {isEditingSql ? 'Save & Lock' : 'Edit SQL'}
            </Button>
          </div>

          <div className="relative group">
            {isEditingSql ? (
              <textarea
                className="w-full h-32 font-mono text-xs p-4 rounded-xl bg-surface border border-accent/30 text-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                value={generatedSql}
                onChange={(e) => setGeneratedSql(e.target.value)}
              />
            ) : (
              <pre className="w-full p-4 rounded-xl bg-surface/60 border border-border/30 text-xs font-mono text-accent overflow-x-auto whitespace-pre-wrap">
                {generatedSql}
              </pre>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {queryError && (
                <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg border border-red-400/20">
                  {queryError}
                </p>
              )}
            </div>
            <Button 
              className="px-6"
              onClick={handleExecute}
              disabled={isAnalyzing || dbStatus !== 'ready'}
            >
              {isAnalyzing ? 'Running...' : 'Run Query'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant: 'default' | 'success' | 'danger', className?: string }) {
  const styles = {
    default: 'bg-white/5 text-muted border-border/50',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase font-bold tracking-tighter ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
