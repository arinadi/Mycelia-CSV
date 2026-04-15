import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ApiProvider, ColumnType, CsvColumn, ParseStatus, AiModel, HistoryItem } from './types';

interface AppState {
  // API Config
  provider: ApiProvider;
  baseUrl: string;
  apiKey: string;
  availableModels: AiModel[];
  selectedModelId: string | null;
  isValid: boolean | null;
  validationError: string | null;

  // DuckDB
  dbStatus: 'idle' | 'loading' | 'ready' | 'error';
  dbError: string | null;

  // Query & Results
  userPrompt: string;
  generatedSql: string;
  isAnalyzing: boolean;
  queryResult: { 
    rows: Record<string, unknown>[]; 
    columns: string[]; 
    totalCount: number;
    currentPage: number;
    pageSize: number;
  } | null;
  queryError: string | null;
  executionTime: number | null;

  // History
  history: HistoryItem[];

  // CSV Data
  file: File | null;
  fileName: string | null;
  fileSizeBytes: number;
  totalRows: number;
  schema: CsvColumn[];
  parseStatus: ParseStatus;
  parseError: string | null;
  sampleRows: Record<string, unknown>[];
  isRawDataOpen: boolean;
  isRawDataLoading: boolean;
  rawData: Record<string, unknown>[];
  rawDataPage: number;
  rawDataPageSize: number;
  isSidebarCollapsed: boolean;

  // Actions
  setProvider: (p: ApiProvider) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (k: string) => void;
  setSelectedModelId: (id: string | null) => void;
  validate: () => Promise<void>;
  fetchModels: () => Promise<void>;
  clear: () => void;
  initSession: () => void;
  toggleSidebar: () => void;

  setFile: (f: File) => void;
  setSchema: (columns: CsvColumn[]) => void;
  setTotalRows: (count: number) => void;
  setParseStatus: (status: ParseStatus, error?: string) => void;
  setSampleRows: (rows: Record<string, unknown>[]) => void;
  updateColumnType: (colName: string, type: ColumnType) => void;
  resetCsv: () => void;
  initDB: () => Promise<void>;

  // Query Actions
  setUserPrompt: (p: string) => void;
  setGeneratedSql: (sql: string) => void;
  runAiQuery: () => Promise<void>;
  executeSql: (sql: string, isAutoRetry?: boolean, retryCount?: number) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  loadHistoryItem: (id: string) => void;
  toggleStarHistoryItem: (id: string) => void;
  deleteHistoryItem: (id: string) => void;
  clearHistory: (onlyUnstarred?: boolean) => void;
  // Raw Data Actions
  openRawData: () => Promise<void>;
  closeRawData: () => void;
  fetchRawData: () => Promise<void>;
  setRawDataPage: (page: number) => void;
  setRawDataPageSize: (size: number) => void;
  exportQueryResult: (format: 'csv' | 'parquet') => Promise<void>;
  fetchMetadata: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  provider: 'anthropic',
  baseUrl: 'https://api.anthropic.com/v1',
  apiKey: '',
  availableModels: [],
  selectedModelId: null,
  isValid: null,
  validationError: null,

  dbStatus: 'idle',
  dbError: null,

  userPrompt: '',
  generatedSql: '',
  isAnalyzing: false,
  queryResult: null,
  queryError: null,
  executionTime: null,
  history: [],

  file: null,
  fileName: null,
  fileSizeBytes: 0,
  totalRows: 0,
  schema: [],
  parseStatus: 'idle',
  parseError: null,
  sampleRows: [],
  isRawDataOpen: false,
  isRawDataLoading: false,
  rawData: [],
  rawDataPage: 0,
  rawDataPageSize: 50,
  isSidebarCollapsed: false,

  setProvider: (p) => {
    let baseUrl = '';
    if (p === 'anthropic') baseUrl = 'https://api.anthropic.com/v1';
    else if (p === 'openai') baseUrl = 'https://api.openai.com/v1';
    else if (p === 'gemini') baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    
    set({ provider: p, baseUrl, isValid: null, validationError: null, availableModels: [], selectedModelId: null });
  },

  setBaseUrl: (url) => {
    set({ baseUrl: url, isValid: null, validationError: null });
  },

  setApiKey: (k) => {
    set({ apiKey: k, isValid: null, validationError: null });
  },

  setSelectedModelId: (id) => {
    set({ selectedModelId: id });
  },

  validate: async () => {
    const { provider, apiKey, baseUrl, fetchModels } = get();
    if (!apiKey.trim()) {
      set({ isValid: false, validationError: 'API key is empty' });
      return;
    }

    set({ isValid: null, validationError: null });

    try {
      // Validation via fetching models (standard check)
      if (provider === 'gemini') {
        const url = `${baseUrl}/models?key=${apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const models = data.models
            ?.filter((m: { supportedGenerationMethods: string[] }) => m.supportedGenerationMethods.includes('generateContent'))
            .map((m: { name: string; displayName: string; description?: string }) => ({
              id: m.name.split('/').pop(),
              name: m.displayName,
              description: m.description
            })) || [];
          
          set({ 
            isValid: true, 
            availableModels: models,
            selectedModelId: get().selectedModelId || models[0]?.id || null
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Error ${res.status}`);
        }
      } else {
        // OpenAI or Anthropic (and others)
        const url = provider === 'anthropic' ? `${baseUrl}/messages` : `${baseUrl}/models`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
          headers['anthropic-dangerous-direct-browser-access'] = 'true';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const res = await fetch(url, {
          method: provider === 'anthropic' ? 'POST' : 'GET',
          body: provider === 'anthropic' ? JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Ping' }]
          }) : undefined,
          headers
        });

        if (res.ok) {
          set({ isValid: true });
          await fetchModels();
        } else {
          const errData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
          throw new Error(errData.error?.message || `Error ${res.status}`);
        }
      }
    } catch (error: unknown) {
      const e = error as Error;
      let errStr = e.message;
      if (errStr.includes('401')) errStr = 'Invalid key';
      else if (errStr.includes('404')) errStr = 'Endpoint not found (Check Base URL)';
      else if (e.name === 'TypeError') errStr = 'Network error / CORS blocked';
      set({ isValid: false, validationError: errStr });
    }
  },

  fetchModels: async () => {
    const { provider, apiKey, baseUrl } = get();
    try {
      if (provider === 'openai') {
        const res = await fetch(`${baseUrl}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (res.ok) {
          const data = await res.json();
          const models = (data.data as { id: string; owned_by?: string }[])
            ?.sort((a, b) => {
              const ownerA = a.owned_by || '';
              const ownerB = b.owned_by || '';
              if (ownerA !== ownerB) return ownerA.localeCompare(ownerB);
              return a.id.localeCompare(b.id);
            })
            .map((m) => ({ 
              id: m.id, 
              name: m.id,
              description: m.owned_by ? `(${m.owned_by})` : undefined
            })) || [];
          set({ 
            availableModels: models,
            selectedModelId: get().selectedModelId || models[0]?.id || null
          });
        }
      } else if (provider === 'anthropic') {
         const models = [
           { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
           { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
           { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
         ];
         set({ availableModels: models, selectedModelId: get().selectedModelId || models[0].id });
      }
    } catch (e) {
      console.error('Failed to fetch models', e);
    }
  },

  clear: () => {
    set({ apiKey: '', isValid: null, validationError: null, availableModels: [], selectedModelId: null });
  },

  initSession: () => {
    // Legacy support: intentionally left empty as persistence handles this now
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },

  setFile: (f: File) => {
    set({
      file: f,
      fileName: f.name,
      fileSizeBytes: f.size,
      parseStatus: 'idle',
      parseError: null,
      schema: [],
      totalRows: 0,
      sampleRows: []
    });
  },

  setSchema: (columns: CsvColumn[]) => {
    set({ schema: columns });
  },

  setTotalRows: (count: number) => set({ totalRows: count }),
  setParseStatus: (status: ParseStatus, error?: string) => set({ parseStatus: status, parseError: error || null }),
  setSampleRows: (rows: Record<string, unknown>[]) => set({ sampleRows: rows }),
  updateColumnType: (colName: string, type: ColumnType) => set((state) => ({
      schema: state.schema.map((col) => 
        col.name === colName ? { ...col, type } : col
      )
    })),

  resetCsv: () => {
    set({
      file: null,
      fileName: null,
      fileSizeBytes: 0,
      totalRows: 0,
      schema: [],
      parseStatus: 'idle',
      parseError: null
    });
  },

  initDB: async () => {
    const { file, totalRows } = get();
    if (!file || totalRows === 0) return;

    set({ dbStatus: 'loading', dbError: null });
    try {
      const { initDuckDB } = await import('./duckdb');
      await initDuckDB(file);
      set({ dbStatus: 'ready' });
      await get().fetchMetadata();
    } catch (e: unknown) {
      const err = e as Error;
      console.error('DuckDB init failed', err);
      set({ dbStatus: 'error', dbError: err.message });
    }
  },

  fetchMetadata: async () => {
    try {
      const { getTableSchema } = await import('./duckdb');
      const { detectColumnFormat } = await import('./inferType');
      const metadata = await getTableSchema();
      
      const mappedSchema = metadata.columns.map(col => {
        // Map DuckDB types to our app types
        let type: ColumnType = 'string';
        const rawType = col.type.toUpperCase();
        
        if (rawType.includes('INT') || rawType.includes('DOUBLE') || rawType.includes('FLOAT') || rawType.includes('DECIMAL')) {
          type = 'number';
        } else if (rawType.includes('BOOL')) {
          type = 'boolean';
        } else if (rawType.includes('DATE') || rawType.includes('TIME')) {
          type = 'date';
        }

        const sampleValues = metadata.sampleRows.map(r => String(r[col.name]));

        return {
          name: col.name,
          type,
          rawType: col.type, // Map the raw DuckDB type string
          format: type === 'string' ? detectColumnFormat(sampleValues) : 'text',
          sampleValues: sampleValues.slice(0, 3)
        };
      });

      set({
        schema: mappedSchema,
        totalRows: metadata.totalRows,
        sampleRows: metadata.sampleRows.slice(0, 5),
        parseStatus: 'done'
      });
    } catch (e) {
      console.error('Failed to fetch metadata', e);
    }
  },

  setUserPrompt: (p) => set({ userPrompt: p }),
  setGeneratedSql: (sql) => set({ generatedSql: sql }),

  runAiQuery: async () => {
    const { userPrompt, schema, apiKey } = get();
    if (!userPrompt.trim() || !apiKey) return;

    set({ isAnalyzing: true, queryError: null });
    try {
      const { generateSQL } = await import('./ai-service');
      const { provider, apiKey, baseUrl, selectedModelId } = get();
      const sql = await generateSQL(userPrompt, {
        columns: schema.map(c => ({ name: c.name, type: c.rawType || c.type })),
        sampleRows: get().sampleRows
      }, {
        provider,
        apiKey,
        baseUrl,
        selectedModelId: selectedModelId || ''
      });
      set({ generatedSql: sql, isAnalyzing: false });
    } catch (e: unknown) {
      const err = e as Error;
      console.error('AI generation failed', err);
      set({ isAnalyzing: false, queryError: err.message });
    }
  },

  executeSql: async (sql: string, isAutoRetry: boolean = false, retryCount: number = 0) => {
    const { dbStatus, userPrompt, schema } = get();
    if (dbStatus !== 'ready') return;

    if (!isAutoRetry) {
      set({ isAnalyzing: true, queryError: null });
    }
    
    const start = performance.now();
    try {
      const { getQueryMetadata, fetchPaginatedRows } = await import('./duckdb');
      
      // 1. Get metadata (columns and total count) using the new view-based approach
      const { columns, rowCount } = await getQueryMetadata(sql);
      
      // 2. Fetch the first page (default 50 rows)
      const pageSize = 50;
      const initialRows = await fetchPaginatedRows(pageSize, 0);
      
      const end = performance.now();
      const executionTime = Math.round(end - start);
      
      const queryResult = {
        rows: initialRows,
        columns,
        totalCount: rowCount,
        currentPage: 0,
        pageSize
      };

      set((state) => ({ 
        queryResult, 
        isAnalyzing: false, 
        executionTime,
        queryError: null,
        history: [
          {
            id: crypto.randomUUID(),
            prompt: userPrompt,
            sql,
            result: { 
              rows: initialRows, 
              columns, 
              totalCount: rowCount,
              currentPage: 0,
              pageSize
            }, 
            timestamp: Date.now(),
            executionTime,
            isStarred: false
          },
          ...state.history
        ]
      }));
    } catch (e: unknown) {
      const err = e as Error;
      
      if (retryCount < 2) {
        console.warn(`DuckDB execution failed. Auto-retrying (Attempt ${retryCount + 1}/2)...`, err);
        set({ queryError: `DuckDB Error: ${err.message}. Auto-fixing SQL (Attempt ${retryCount + 1}/2)...` });
        
        try {
          const { generateSQL, getSystemPrompt } = await import('./ai-service');
          const systemRules = getSystemPrompt({
             columns: schema.map(c => ({ name: c.name, type: c.rawType || c.type })),
             sampleRows: get().sampleRows
          });

          const fixPrompt = `${systemRules}\n\nFIX REQUIRED: The previous query failed.\n` +
            `Error: ${err.message}\n` +
            `Failed SQL: ${sql}\n\n` +
            `Please provide the CORRECTED SQL. \n` +
            `IMPORTANT: You MUST still follow all rules in the system prompt above, including READABLE DATE FORMATTING and JSON EXTRACTION rules.`;
          
          const { provider, apiKey, baseUrl, selectedModelId } = get();
          const newSql = await generateSQL(fixPrompt, {
             columns: schema.map(c => ({ name: c.name, type: c.rawType || c.type })),
             sampleRows: get().sampleRows
          }, {
            provider,
            apiKey,
            baseUrl,
            selectedModelId: selectedModelId || ''
          });
          
          set({ generatedSql: newSql });
          await get().executeSql(newSql, true, retryCount + 1);
        } catch (aiErr) {
           console.error('AI Fix generation failed', aiErr);
           set({ isAnalyzing: false, queryError: err.message });
        }
      } else {
        console.error('SQL execution failed after retries', err);
        set({ isAnalyzing: false, queryError: err.message });
      }
    }
  },

  goToPage: async (page: number) => {
    const { queryResult, dbStatus } = get();
    if (!queryResult || dbStatus !== 'ready') return;
    
    set({ isAnalyzing: true });
    try {
      const { fetchPaginatedRows } = await import('./duckdb');
      const offset = page * queryResult.pageSize;
      const rows = await fetchPaginatedRows(queryResult.pageSize, offset);
      
      set({
        queryResult: {
          ...queryResult,
          rows,
          currentPage: page
        },
        isAnalyzing: false
      });
    } catch (e) {
      console.error('Failed to fetch page', e);
      set({ isAnalyzing: false, queryError: (e as Error).message });
    }
  },

  loadHistoryItem: (id) => {
    const item = get().history.find((h) => h.id === id);
    if (item) {
      // Migrate structure for legacy history items
      const result = {
        ...item.result,
        totalCount: item.result.totalCount ?? (item.result as unknown as { rowCount?: number }).rowCount ?? 0,
        currentPage: item.result.currentPage ?? 0,
        pageSize: item.result.pageSize ?? 50,
      };

      set({
        userPrompt: item.prompt,
        generatedSql: item.sql,
        queryResult: result as unknown as AppState['queryResult'], // Safely cast migrated structure to state type
        executionTime: item.executionTime,
        queryError: null
      });
    }
  },

  toggleStarHistoryItem: (id) => {
    set((state) => ({
      history: state.history.map((item) => 
        item.id === id ? { ...item, isStarred: !item.isStarred } : item
      )
    }));
  },

  deleteHistoryItem: (id) => {
    set((state) => ({
      history: state.history.filter((item) => item.id !== id)
    }));
  },

  clearHistory: (onlyUnstarred = false) => {
    set((state) => ({
      history: onlyUnstarred 
        ? state.history.filter((item) => item.isStarred) 
        : []
    }));
  },
  
  exportQueryResult: async (format) => {
    const { generatedSql, queryResult, userPrompt } = get();
    if (!generatedSql || !queryResult) return;
    
    set({ isAnalyzing: true });
    try {
      const { exportToFormat } = await import('./duckdb');
      const blob = await exportToFormat(generatedSql, format);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const extension = format === 'parquet' ? 'parquet' : 'csv';
      
      a.href = url;
      a.download = `${userPrompt.slice(0, 30).replace(/\s+/g, '_')}_${dateStr}.${extension}`;
      a.click();
      
      URL.revokeObjectURL(url);
      set({ isAnalyzing: false });
    } catch (e) {
      console.error('Export failed', e);
      set({ isAnalyzing: false, queryError: `Export failed: ${(e as Error).message}` });
    }
  },

  openRawData: async () => {
    const { dbStatus, fetchRawData } = get();
    if (dbStatus !== 'ready') return;

    set({ isRawDataOpen: true, rawDataPage: 0 });
    await fetchRawData();
  },

  fetchRawData: async () => {
    const { rawDataPage, rawDataPageSize, dbStatus } = get();
    if (dbStatus !== 'ready') return;

    set({ isRawDataLoading: true });
    try {
      const { runQuery } = await import('./duckdb');
      const offset = rawDataPage * rawDataPageSize;
      const result = await runQuery(`SELECT * FROM data LIMIT ${rawDataPageSize} OFFSET ${offset}`);
      
      const safeRows = result.rows.map(row => {
        const newRow: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          newRow[k] = typeof v === 'bigint' ? Number(v) : v;
        }
        return newRow;
      });
      
      set({ rawData: safeRows, isRawDataLoading: false });
    } catch (e) {
      console.error('Failed to fetch raw data', e);
      set({ isRawDataLoading: false });
    }
  },

  setRawDataPage: (page) => {
    set({ rawDataPage: page });
    get().fetchRawData();
  },

  setRawDataPageSize: (size) => {
    set({ rawDataPageSize: size, rawDataPage: 0 });
    get().fetchRawData();
  },

  closeRawData: () => set({ isRawDataOpen: false, rawData: [], isRawDataLoading: false }),
}), {
      name: 'csv-reporter-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        provider: state.provider,
        baseUrl: state.baseUrl,
        apiKey: state.apiKey,
        selectedModelId: state.selectedModelId,
        isValid: state.isValid,
        // Strip rows from history items to save localStorage quota
        history: state.history.map(item => ({
          ...item,
          result: {
            ...item.result,
            rows: [] as Record<string, unknown>[]
          }
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.isValid && state.apiKey) {
           state.fetchModels();
        }
      }
    }
  )
);
