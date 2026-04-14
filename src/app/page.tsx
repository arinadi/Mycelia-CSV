import React from 'react';
import { DataSourcePanel } from '@/components/features/DataSourcePanel/DataSourcePanel';
import { QueryPanel } from '@/components/features/QueryPanel/QueryPanel';
import { ResultPanel } from '@/components/features/ResultPanel/ResultPanel';

export default function Home() {
  return (
    <div className="flex-1 grid grid-cols-12 gap-6 p-4 md:p-6 min-h-0">
      {/* Left Column: Data Source */}
      <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col min-h-[300px]">
        <DataSourcePanel />
      </div>

      {/* Right Column: Query & Results */}
      <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-h-0 overflow-hidden">
        <QueryPanel />
        <ResultPanel />
      </div>
    </div>
  );
}
