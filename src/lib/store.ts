import { create } from 'zustand';
import type { ApiProvider, ColumnType, CsvColumn, ParseStatus, AiModel } from './types';

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
  queryResult: { rows: Record<string, unknown>[]; columns: string[]; rowCount: number } | null;
  queryError: string | null;
  executionTime: number | null;

  // History
  history: {
    id: string;
    prompt: string;
    sql: string;
    result: { rows: Record<string, unknown>[]; columns: string[]; rowCount: number };
    timestamp: number;
  }[];

  // CSV Data
  file: File | null;
  fileName: string | null;
  fileSizeBytes: number;
  totalRows: number;
  schema: CsvColumn[];
  parseStatus: ParseStatus;
  parseError: string | null;

  // Actions
  setProvider: (p: ApiProvider) => void;
  setBaseUrl: (url: string) => void;
  setApiKey: (k: string) => void;
  setSelectedModelId: (id: string | null) => void;
  validate: () => Promise<void>;
  fetchModels: () => Promise<void>;
  clear: () => void;
  initSession: () => void;

  setFile: (f: File) => void;
  setSchema: (columns: CsvColumn[]) => void;
  setTotalRows: (count: number) => void;
  setParseStatus: (status: ParseStatus, error?: string) => void;
  updateColumnType: (colName: string, type: ColumnType) => void;
  resetCsv: () => void;
  initDB: () => Promise<void>;

  // Query Actions
  setUserPrompt: (p: string) => void;
  setGeneratedSql: (sql: string) => void;
  runAiQuery: () => Promise<void>;
  executeSql: (sql: string) => Promise<void>;
  loadHistoryItem: (id: string) => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
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
            selectedModelId: models[0]?.id || null
          });
          sessionStorage.setItem('csv_reporter_api_key', apiKey);
          sessionStorage.setItem('csv_reporter_api_provider', provider);
          sessionStorage.setItem('csv_reporter_api_base_url', baseUrl);
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
          sessionStorage.setItem('csv_reporter_api_key', apiKey);
          sessionStorage.setItem('csv_reporter_api_provider', provider);
          sessionStorage.setItem('csv_reporter_api_base_url', baseUrl);
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
          const models = (data.data as { id: string }[])
            ?.filter((m) => m.id.includes('gpt'))
            .map((m) => ({ id: m.id, name: m.id })) || [];
          set({ 
            availableModels: models,
            selectedModelId: get().selectedModelId || models[0]?.id || null
          });
        }
      } else if (provider === 'anthropic') {
         // Anthropic doesn't have a public models list endpoint easily accessible via browser without CORS
         // Hardcode common ones for now as per plan
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
    sessionStorage.removeItem('csv_reporter_api_key');
    sessionStorage.removeItem('csv_reporter_api_provider');
    sessionStorage.removeItem('csv_reporter_api_base_url');
  },

  initSession: () => {
    if (typeof window !== 'undefined') {
      const storedKey = sessionStorage.getItem('csv_reporter_api_key');
      const storedProvider = sessionStorage.getItem('csv_reporter_api_provider') as ApiProvider | null;
      const storedBaseUrl = sessionStorage.getItem('csv_reporter_api_base_url');
      if (storedKey) {
        set({
          apiKey: storedKey,
          provider: storedProvider || 'anthropic',
          baseUrl: storedBaseUrl || (storedProvider === 'gemini' ? 'https://generativelanguage.googleapis.com/v1beta' : storedProvider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1'),
          isValid: true,
        });
        get().fetchModels();
      }
    }
  },

  setFile: (f: File) => {
    set({
      file: f,
      fileName: f.name,
      fileSizeBytes: f.size,
      parseStatus: 'idle',
      parseError: null,
      schema: [],
      totalRows: 0
    });
  },

  setSchema: (columns: CsvColumn[]) => {
    set({ schema: columns });
  },

  setTotalRows: (count: number) => {
    set({ totalRows: count });
  },

  setParseStatus: (status: ParseStatus, error?: string) => {
    set({ parseStatus: status, parseError: error || null });
  },

  updateColumnType: (colName: string, type: ColumnType) => {
    set((state) => ({
      schema: state.schema.map((col) => 
        col.name === colName ? { ...col, type } : col
      )
    }));
  },

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
    } catch (e: unknown) {
      const err = e as Error;
      console.error('DuckDB init failed', err);
      set({ dbStatus: 'error', dbError: err.message });
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
      const sql = await generateSQL(userPrompt, {
        columns: schema.map(c => ({ name: c.name, type: c.type })),
        sampleRows: schema[0]?.sampleValues.map(v => ({ [schema[0].name]: v })) || []
      });
      set({ generatedSql: sql, isAnalyzing: false });
    } catch (e: unknown) {
      const err = e as Error;
      console.error('AI generation failed', err);
      set({ isAnalyzing: false, queryError: err.message });
    }
  },

  executeSql: async (sql: string) => {
    const { dbStatus, userPrompt } = get();
    if (dbStatus !== 'ready') return;

    set({ isAnalyzing: true, queryError: null });
    const start = performance.now();
    try {
      const { runQuery } = await import('./duckdb');
      const result = await runQuery(sql);
      const end = performance.now();
      const executionTime = Math.round(end - start);
      
      set((state) => ({ 
        queryResult: result, 
        isAnalyzing: false, 
        executionTime,
        history: [
          {
            id: crypto.randomUUID(),
            prompt: userPrompt,
            sql,
            result,
            timestamp: Date.now()
          },
          ...state.history
        ]
      }));
    } catch (e: unknown) {
      const err = e as Error;
      console.error('SQL execution failed', err);
      set({ isAnalyzing: false, queryError: err.message });
    }
  },

  loadHistoryItem: (id) => {
    const item = get().history.find((h) => h.id === id);
    if (item) {
      set({
        userPrompt: item.prompt,
        generatedSql: item.sql,
        queryResult: item.result,
        queryError: null
      });
    }
  }
}));
