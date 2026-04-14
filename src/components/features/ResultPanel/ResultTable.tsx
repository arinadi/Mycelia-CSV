"use client";

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';

export function ResultTable() {
  const { queryResult } = useAppStore();
  
  const columns = useMemo(() => {
    if (!queryResult) return [];
    return queryResult.columns.map((col) => ({
      accessorKey: col,
      header: col,
      cell: (info: { getValue: () => unknown }) => {
        const val = info.getValue();
        if (val instanceof Date) return val.toLocaleDateString();
        if (typeof val === 'number') return val.toLocaleString();
        return String(val);
      },
    }));
  }, [queryResult]);

  const table = useReactTable({
    data: queryResult?.rows || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  });

  if (!queryResult) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-bg-base/30">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-surface/50 sticky top-0 z-10">
                {headerGroup.headers.map((header) => (
                  <th 
                    key={header.id} 
                    className="px-4 py-3 font-semibold text-muted cursor-pointer hover:text-text transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: ' 🔼',
                        desc: ' 🔽',
                      }[header.column.getIsSorted() as string] ?? null}
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

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
