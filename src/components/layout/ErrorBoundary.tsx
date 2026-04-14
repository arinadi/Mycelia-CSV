"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-surface/20 rounded-2xl border border-red-500/20 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Something went wrong</h2>
          <p className="text-sm text-muted mb-8 max-w-md">
            The analytical engine or a UI component encountered an unexpected error. 
            All your results are stored locally, but you may need to reload.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-surface border border-border/50 hover:bg-surface/50 transition-all text-text"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent/80 transition-all shadow-lg shadow-accent/20"
            >
              Reload Page
            </button>
          </div>
          {this.state.error && (
             <div className="mt-8 p-4 bg-black/40 rounded-lg border border-border/30 w-full text-left overflow-auto max-h-32">
               <code className="text-[10px] text-red-400 font-mono whitespace-pre">{this.state.error.message}</code>
             </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
