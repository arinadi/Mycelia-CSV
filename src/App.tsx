import React from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Sidebar } from '@/components/features/Sidebar/Sidebar'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { RawDataModal } from '@/components/features/DataSourcePanel/RawDataModal'
import { DataSourcePanel } from '@/components/features/DataSourcePanel/DataSourcePanel'
import { QueryPanel } from '@/components/features/QueryPanel/QueryPanel'
import { ResultPanel } from '@/components/features/ResultPanel/ResultPanel'
import { useAppStore } from '@/lib/store'
import { KeyManagerModal } from '@/components/features/KeyManager/KeyManager'

export default function App() {
  const { isValid, apiKey, setProvider, setBaseUrl } = useAppStore();
  const showKeyMandatory = isValid !== true;

  // Handle Gameloft UTM
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('utm') === 'gameloft' && !apiKey) {
      setProvider('openai');
      setBaseUrl('https://ask.ai.gameloft.org/api');
    }
  }, [apiKey, setProvider, setBaseUrl]);

  return (
    <div className="antialiased min-h-screen flex flex-col" style={{ fontFamily: "'Geist', sans-serif" }}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <aside className="flex-shrink-0 hidden lg:block">
            <Sidebar />
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden p-6">
            <div className="flex-1 grid grid-cols-12 gap-6 p-4 md:p-6 min-h-0">
              <div className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col min-h-[300px]">
                <DataSourcePanel />
              </div>
              <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-h-0">
                <QueryPanel />
                <ResultPanel />
              </div>
            </div>
          </main>
        </ErrorBoundary>
      </div>
      <Footer />
      <RawDataModal />
      <KeyManagerModal isOpen={showKeyMandatory} onClose={() => {}} isMandatory={true} />
    </div>
  )
}
