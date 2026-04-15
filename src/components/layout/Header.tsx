import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
