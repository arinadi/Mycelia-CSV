"use client";

import React from 'react';
import { useAppStore } from '@/lib/store';

export function Sidebar() {
  const { history, loadHistoryItem } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-surface/30 border-r border-border/50 backdrop-blur-md">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="9" />
          </svg>
          <h2 className="text-sm font-bold uppercase tracking-wider text-text">History</h2>
        </div>
        <p className="text-[10px] text-muted uppercase tracking-tighter">Your session queries</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center opacity-40">
            <p className="text-xs italic text-muted">No queries yet</p>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-2">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadHistoryItem(item.id)}
                className="group w-full text-left p-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-surface/50 transition-all"
              >
                <p className="text-xs font-medium text-text line-clamp-2 mb-2 group-hover:text-accent transition-colors">
                  {item.prompt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">
                    {item.result.rowCount.toLocaleString()} rows
                  </span>
                  <span className="text-[10px] text-muted/60">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-bg-base/20">
        <div className="px-4 py-3 rounded-xl bg-accent/5 border border-accent/10">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Storage</p>
            <p className="text-[10px] text-accent/60 font-mono">100% Session</p>
          </div>
          <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
            <div className="h-full bg-accent w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
