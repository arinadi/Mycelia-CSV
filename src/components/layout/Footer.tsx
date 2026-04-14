import React from 'react';

export function Footer() {
  return (
    <footer className="flex items-center justify-between border-t border-border/80 bg-bg-base px-6 py-3 text-[11px] font-medium text-muted tracking-wide">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          DuckDB Engine: Active
        </div>
        <div>
          Local Processing: Enabled
        </div>
      </div>
      
      <div className="flex items-center gap-6 opacity-70 hover:opacity-100 transition-opacity">
        <div>
          Privacy Mode: 100% Local
        </div>
        <div>
          v1.0.0-beta
        </div>
      </div>
    </footer>
  );
}
