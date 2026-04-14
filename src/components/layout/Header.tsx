"use client";

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { KeyManagerModal } from '@/components/features/KeyManager/KeyManager';

export function Header() {
  const { isValid, selectedModelId, availableModels } = useAppStore();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  const activeModel = availableModels.find(m => m.id === selectedModelId);
  const modelName = activeModel?.name || selectedModelId;

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-border/80 px-6 bg-surface/50 backdrop-blur-md">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-emerald-950 font-bold shadow-lg shadow-accent-glow">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h16" opacity="0.3"/>
              <ellipse cx="12" cy="6" rx="8" ry="3"/>
              <path d="M4 6v6a8 3 0 0 0 16 0V6"/>
              <path d="M4 12v6a8 3 0 0 0 16 0v-6"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">Mycelia <span className="text-accent opacity-80">CSV</span></h1>
            <p className="text-[10px] uppercase tracking-widest text-muted/80">Local-First Analytics</p>
          </div>
        </div>

        {/* Center: Navigation Pills */}
        <div className="flex items-center gap-2 rounded-full border border-border bg-[#11211b]/50 p-1">
          <Button variant="nav_active" className="rounded-full px-5">
            <svg width="16" height="16" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            Query
          </Button>
          <Button variant="ghost" className="rounded-full px-5">
            <svg width="16" height="16" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
            History
          </Button>
          <Button variant="ghost" className="rounded-full px-5" onClick={() => setIsKeyModalOpen(true)}>
            <svg width="16" height="16" className="mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </Button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center">
          <button onClick={() => setIsKeyModalOpen(true)}>
            {isValid ? (
              <Badge variant="success" className="cursor-pointer hover:bg-emerald-500/20 px-3 py-1.5 border border-emerald-500/20 flex items-center gap-2">
                 <span>API Connected</span>
                 {modelName && (
                   <span className="opacity-60 text-[10px] border-l border-emerald-500/30 pl-2 ml-1 uppercase tracking-wider font-mono">
                     {modelName}
                   </span>
                 )}
              </Badge>
            ) : (
              <Badge variant="danger" className="cursor-pointer hover:bg-red-500/20 px-3 py-1.5 font-medium flex items-center gap-2 border border-red-500/20">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Key Required
              </Badge>
            )}
          </button>
        </div>
      </header>

      <KeyManagerModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} />
    </>
  );
}
