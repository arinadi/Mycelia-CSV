import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { FileJson, Layers, Calendar, Hash, CheckCircle2, Type, HelpCircle, X, ChevronRight } from 'lucide-react';

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
    queryError,
    schema
  } = useAppStore();

  
  // Mentions State
  const [showMentions, setShowMentions] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRunAi = async () => {
    if (!userPrompt.trim()) return;
    await runAiQuery();
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

  const getCaretCoordinates = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };
    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    
    // Create mirror div to calculate position
    const mirror = document.createElement('div');
    const style = window.getComputedStyle(textarea);
    
    // Copy all relevant styles
    const properties = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
      'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
    ];
    
    properties.forEach(prop => {
      // @ts-expect-error - Computed styles are complex but valid for mirror logic
      mirror.style[prop] = style[prop];
    });
    
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    
    const textBeforeCaret = textarea.value.substring(0, selectionStart);
    mirror.textContent = textBeforeCaret;
    
    const span = document.createElement('span');
    span.textContent = '|';
    mirror.appendChild(span);
    
    document.body.appendChild(mirror);
    const { offsetTop: top, offsetLeft: left } = span;
    document.body.removeChild(mirror);
    
    return { 
      top: top + parseInt(style.lineHeight) - textarea.scrollTop, 
      left: Math.min(left, textarea.clientWidth - 150) // Keep in bounds
    };
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart;
    setUserPrompt(value);

    // Look back for '@'
    const textBeforeCaret = value.substring(0, cursor);
    const lastAtIdx = textBeforeCaret.lastIndexOf('@');

    if (lastAtIdx !== -1) {
      const search = textBeforeCaret.substring(lastAtIdx + 1);
      // Only show if no space between @ and cursor
      if (!search.includes(' ')) {
        setMentionSearch(search);
        setMentionIndex(0);
        setMentionCoords(getCaretCoordinates());
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (colName: string) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart;
    const textBeforeCaret = userPrompt.substring(0, cursor);
    const lastAtIdx = textBeforeCaret.lastIndexOf('@');
    
    const newValue = 
      userPrompt.substring(0, lastAtIdx) + 
      colName + 
      userPrompt.substring(cursor);
      
    setUserPrompt(newValue);
    setShowMentions(false);
    
    // Maintain focus
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursor = lastAtIdx + colName.length;
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions) {
      const filtered = schema.filter(col => 
        col.name.toLowerCase().includes(mentionSearch.toLowerCase())
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[mentionIndex]) {
          insertMention(filtered[mentionIndex].name);
        }
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    }
  };

  const filteredColumns = schema.filter(col => 
    col.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className={`flex flex-col rounded-2xl bg-surface/40 border border-border/50 p-6 backdrop-blur-sm transition-all ${showCheatSheet || showMentions ? 'relative z-50' : 'relative z-10'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
          <div className="flex items-center gap-2">
            <label htmlFor="nl-query-input" className="text-sm font-semibold uppercase tracking-wider text-text cursor-pointer">
              Natural Language Query
            </label>
            <div className="relative">
              <button 
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className="p-1 rounded-full hover:bg-white/5 text-muted hover:text-accent transition-colors"
                title="Query Cheat Sheet"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {showCheatSheet && (
                <div className="absolute left-0 top-8 z-[80] w-[450px] rounded-2xl bg-surface/95 border border-border/50 backdrop-blur-xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-accent/20">
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <h4 className="text-sm font-bold text-text uppercase tracking-widest">Excel to SQL Cheat Sheet</h4>
                    </div>
                    <button onClick={() => setShowCheatSheet(false)} className="text-muted hover:text-text">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-muted tracking-tighter mb-1 px-2">
                      <div className="col-span-4">Excel Goal</div>
                      <div className="col-span-1 text-center">→</div>
                      <div className="col-span-7">SQL Equivalent</div>
                    </div>

                    {[
                      { excel: 'Filter Rows', sql: 'WHERE column = "value"', desc: 'Filter data based on conditions' },
                      { excel: 'Pivot Table (Rows)', sql: 'GROUP BY column', desc: 'Aggregate data by categories' },
                      { excel: 'VLOOKUP / XLOOKUP', sql: 'JOIN table ON id', desc: 'Merge data from another table' },
                      { excel: 'Remove Duplicates', sql: 'SELECT DISTINCT', desc: 'Get unique values only' },
                      { excel: 'Sort A-Z / Z-A', sql: 'ORDER BY column', desc: 'Arrange data in order' },
                      { excel: 'SUM / AVG / COUNT', sql: 'SUM() / AVG() / COUNT()', desc: 'Basic arithmetic aggregates' },
                      { excel: 'IF (Condition)', sql: 'CASE WHEN .. THEN', desc: 'Logical "if-then" branching' },
                      { excel: 'Combine Text (&)', sql: 'CONCAT(a, b) / a || b', desc: 'Merge multiple columns into one string' },
                      { excel: 'LEFT / RIGHT / MID', sql: 'SUBSTRING(col, start, len)', desc: 'Extract specific parts of a text string' },
                      { excel: 'Find & Replace', sql: 'REPLACE(col, "old", "new")', desc: 'Swap specific text within a column' },
                      { excel: 'Text Search', sql: 'LIKE "%text%"', desc: 'Search for partial text matches' },
                      { excel: 'Top 10 Rows', sql: 'LIMIT 10', desc: 'Restrict number of results' },
                    ].map((item, i) => (
                      <div key={i} className="group p-2.5 rounded-xl bg-white/5 border border-transparent hover:border-accent/30 hover:bg-accent/5 transition-all">
                        <div className="grid grid-cols-12 gap-2 items-center mb-1">
                          <div className="col-span-4 text-[11px] font-bold text-text/90">{item.excel}</div>
                          <div className="col-span-1 text-center text-muted group-hover:text-accent">
                            <ChevronRight className="w-3 h-3 inline" />
                          </div>
                          <div className="col-span-7 font-mono text-[10px] text-accent font-bold bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                            {item.sql}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted leading-tight pl-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-muted italic">
                    💡 <span className="font-bold text-accent/80">Tip:</span> AI knows your Excel intent. You can type "vlookup with product names" and it will generate the JOIN.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-[10px] uppercase font-bold tracking-tighter">Table: data</Badge>
          {dbStatus !== 'ready' && (
            <Badge variant="danger" className="text-[10px]">Engine Not Ready</Badge>
          )}
        </div>
      </div>
      
      <div className="relative mb-6">
        <textarea
          id="nl-query-input"
          ref={textareaRef}
          className="w-full h-24 rounded-xl bg-bg-base/50 border border-border/50 p-4 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none transition-all"
          placeholder="Type @ to reference columns..."
          value={userPrompt}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          disabled={isAnalyzing}
        />
        
        {showMentions && filteredColumns.length > 0 && (
          <div 
            className="absolute z-[70] w-56 max-h-48 overflow-y-auto rounded-xl bg-surface/90 border border-border/50 backdrop-blur-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
            style={{ 
              top: mentionCoords.top, 
              left: mentionCoords.left
            }}
          >
            {filteredColumns.map((col, idx) => (
              <button
                key={col.name}
                onClick={() => insertMention(col.name)}
                onMouseEnter={() => setMentionIndex(idx)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                  idx === mentionIndex ? 'bg-accent text-emerald-950' : 'hover:bg-white/5 text-text'
                }`}
              >
                <div className={`p-1.5 rounded-md flex-shrink-0 ${idx === mentionIndex ? 'bg-emerald-950/20' : 'bg-surface'}`}>
                  {col.format === 'json' ? (
                    <FileJson className="w-3.5 h-3.5" />
                  ) : col.format === 'serialized' ? (
                    <Layers className="w-3.5 h-3.5" />
                  ) : col.type === 'date' ? (
                    <Calendar className="w-3.5 h-3.5" />
                  ) : col.type === 'number' ? (
                    <Hash className="w-3.5 h-3.5" />
                  ) : col.type === 'boolean' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Type className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate">{col.name}</span>
                  <span className={`text-[9px] uppercase font-bold tracking-tighter ${idx === mentionIndex ? 'opacity-70' : 'text-muted'}`}>
                    {col.format !== 'text' ? col.format : col.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
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

      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-muted uppercase tracking-widest">SQL Query</h4>
        </div>

        <div className="relative group">
          <textarea
            className="w-full h-32 font-mono text-xs p-4 rounded-xl bg-surface border border-border/30 text-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none placeholder:text-accent/20"
            placeholder="Write your SQL here or generate with AI above..."
            value={generatedSql}
            onChange={(e) => setGeneratedSql(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1" aria-live="polite">
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
      <div className="sr-only" aria-live="assertive">
        {isAnalyzing ? 'Processing your query...' : ''}
      </div>
    </div>
  );
}

