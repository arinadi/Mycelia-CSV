"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { 
  CopyIcon, 
  CheckIcon, 
  Star, 
  Trash2, 
  Eraser, 
  History,
  Clock,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

function HistoryCard({ 
  item, 
  loadHistoryItem, 
  toggleStar, 
  deleteItem 
}: { 
  item: import('@/lib/types').HistoryItem, 
  loadHistoryItem: (id: string) => void,
  toggleStar: (id: string) => void,
  deleteItem: (id: string) => void
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(item.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteItem(item.id);
  };

  const rowCount = (item.result as { totalCount?: number; rowCount?: number }).totalCount ?? 
                   (item.result as { totalCount?: number; rowCount?: number }).rowCount ?? 0;

  return (
    <div 
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        item.isStarred 
          ? 'bg-accent/5 border-accent/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
          : 'bg-surface/40 border-border/40 hover:border-accent/30 hover:bg-surface/60'
      }`}
      onClick={() => loadHistoryItem(item.id)}
    >
      {/* Star Indicator Gradient */}
      {item.isStarred && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 blur-2xl -mr-8 -mt-8 rounded-full" />
      )}

      <div className="flex items-start justify-between gap-4">
        <p className={`text-xs font-medium leading-relaxed line-clamp-2 transition-colors ${
          item.isStarred ? 'text-accent' : 'text-text/90 group-hover:text-text'
        }`}>
          {item.prompt}
        </p>
        
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
           <button
            onClick={handleStar}
            className={`p-1.5 rounded-lg transition-all ${
              item.isStarred 
                ? 'text-accent bg-accent/10' 
                : 'text-muted hover:text-accent hover:bg-white/5'
            }`}
            title={item.isStarred ? "Unstar" : "Star to keep"}
          >
            <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'fill-accent' : ''}`} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Delete from history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted/60 uppercase tracking-tight">
            <Database className="w-3 h-3" />
            <span>{rowCount.toLocaleString()} <span className="hidden sm:inline">rows</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted/60 uppercase tracking-tight">
            <Clock className="w-3 h-3" />
            <span>{item.executionTime}ms</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted/40">
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-lg transition-all border ${
              copied 
                ? 'bg-accent/20 border-accent/40 text-accent' 
                : 'bg-white/5 border-transparent text-muted/40 hover:text-accent hover:border-accent/20'
            }`}
            title="Copy SQL"
          >
            {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { 
    history, 
    loadHistoryItem, 
    toggleStarHistoryItem, 
    deleteHistoryItem,
    clearHistory,
    isSidebarCollapsed,
    toggleSidebar
  } = useAppStore();

  const starredCount = history.filter(h => h.isStarred).length;
  const unstarredCount = history.length - starredCount;

  if (isSidebarCollapsed) {
    return (
      <div className="flex flex-col h-full bg-surface/30 border-r border-border/50 backdrop-blur-md w-16 transition-all duration-300 items-center py-6 gap-6">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-all active:scale-95"
          title="Expand History"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-4 items-center overflow-y-auto custom-scrollbar flex-1 w-full px-2">
           <div className="p-2 rounded-lg bg-white/5 text-muted/40">
              <History className="w-5 h-5" />
           </div>
           {history.slice(0, 10).map(item => (
             <button 
               key={item.id}
               onClick={() => loadHistoryItem(item.id)}
               className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                 item.isStarred ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface/40 border-border/40 text-muted/60 hover:border-accent/30'
               }`}
               title={item.prompt}
             >
               <div className="text-[10px] font-black">{item.isStarred ? <Star className="w-3 h-3 fill-accent" /> : item.prompt.charAt(0).toUpperCase()}</div>
             </button>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface/30 border-r border-border/50 backdrop-blur-md w-[300px] transition-all duration-300">
      <div className="p-6 border-b border-border/50 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 border border-accent/20">
              <History className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-text">History</h2>
              <p className="text-[10px] text-muted uppercase tracking-widest font-medium opacity-60">Session Queries</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unstarredCount > 0 && (
              <button 
                onClick={() => clearHistory(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 active:scale-95 group"
                title="Clean unstarred history"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Clean</span>
              </button>
            )}
            <button 
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-white/5 text-muted hover:text-text transition-all"
              title="Minimize Sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-30">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted/50 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Empty History</p>
            <p className="text-[10px] mt-2 text-muted uppercase leading-relaxed">Run queries to see your session history here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((item) => (
              <HistoryCard 
                key={item.id} 
                item={item} 
                loadHistoryItem={loadHistoryItem}
                toggleStar={toggleStarHistoryItem}
                deleteItem={deleteHistoryItem}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-bg-base/20">
        <div className="px-4 py-4 rounded-2xl bg-white/[0.03] border border-white/5 ring-1 ring-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Local Session</p>
            </div>
            <p className="text-[10px] text-accent font-mono font-bold">{history.length} Queries</p>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-accent/50 to-accent rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${Math.min((history.length / 50) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[8px] mt-2 text-muted/40 uppercase tracking-tighter text-center italic">
            Starred items persist across reloads
          </p>
        </div>
      </div>
    </div>
  );
}
