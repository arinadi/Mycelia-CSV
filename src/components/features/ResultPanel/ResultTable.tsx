"use client";

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SearchIcon, TypeIcon, HashIcon, CalendarIcon, ToggleLeftIcon } from 'lucide-react';

export function ResultTable() {
  const { queryResult, goToPage, isAnalyzing } = useAppStore();
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = useMemo(() => {
    if (!queryResult) return [];
    
    // Attempt to guess type from the first defined value
    const guessType = (colName: string) => {
      const firstVal = queryResult.rows.find(r => r[colName] !== null && r[colName] !== undefined)?.[colName];
      if (firstVal instanceof Date) return 'date';
      if (typeof firstVal === 'number') return 'number';
      if (typeof firstVal === 'boolean') return 'boolean';
      return 'string';
    };

    const typeIcons: Record<string, React.ReactNode> = {
      string: <TypeIcon className="w-3 h-3 opacity-50" />,
      number: <HashIcon className="w-3 h-3 opacity-50" />,
      date: <CalendarIcon className="w-3 h-3 opacity-50" />,
      boolean: <ToggleLeftIcon className="w-3 h-3 opacity-50" />
    };

    return queryResult.columns.map((col) => {
      const colType = guessType(col);
      const alignClass = colType === 'number' ? 'text-right' : 'text-left';
      
      return {
        accessorKey: col,
        header: () => (
          <div className={`flex items-center gap-1.5 ${colType === 'number' ? 'justify-end' : ''}`}>
            {typeIcons[colType]}
            <span>{col}</span>
          </div>
        ),
        cell: (info: { getValue: () => unknown }) => {
          const val = info.getValue();
          if (val === null || val === undefined) return <span className="opacity-30">-</span>;
          
          let displayVal = String(val);
          if (val instanceof Date) displayVal = val.toLocaleDateString();
          else if (typeof val === 'number') displayVal = val.toLocaleString();
          
          return <div className={`truncate max-w-[300px] ${alignClass}`}>{displayVal}</div>;
        },
      };
    });
  }, [queryResult]);

  const table = useReactTable({
    data: queryResult?.rows || [],
    columns,
    pageCount: queryResult ? Math.ceil(((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0) / (queryResult.pageSize || 50)) : 0,
    state: { 
      globalFilter,
      pagination: {
        pageIndex: queryResult?.currentPage || 0,
        pageSize: queryResult?.pageSize || 50
      }
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    // We disable client-side pagination since we handle it in DuckDB
    manualPagination: true,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!queryResult) return null;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4 relative">
      {isAnalyzing && (
        <div className="absolute inset-0 bg-bg-base/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-xl transition-all duration-300">
           <div className="flex flex-col items-center gap-3">
             <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             <span className="text-xs font-medium text-text border border-white/10 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">Fetching data...</span>
           </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <Input 
            placeholder="Search current page..." 
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-9 border-border/50 bg-surface/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-bg-base/30">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-surface/50 sticky top-0 z-10">
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id} 
                    className="px-4 py-3 font-semibold text-muted"
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-text font-mono truncate max-w-[300px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-muted">
          Showing {((queryResult.currentPage || 0) * (queryResult.pageSize || 50)) + 1}
          –
          {Math.min(
            ((queryResult.currentPage || 0) + 1) * (queryResult.pageSize || 50),
            ((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0)
          )}{' '}
          of {((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0).toLocaleString()} rows
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(queryResult.currentPage - 1)}
            disabled={queryResult.currentPage === 0 || isAnalyzing}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goToPage(queryResult.currentPage + 1)}
            disabled={((queryResult.currentPage || 0) + 1) * (queryResult.pageSize || 50) >= ((queryResult as { totalCount?: number; rowCount?: number }).totalCount ?? (queryResult as { totalCount?: number; rowCount?: number }).rowCount ?? 0) || isAnalyzing}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
