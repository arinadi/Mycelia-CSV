export type ApiProvider = 'anthropic' | 'openai' | 'gemini';

export interface AiModel {
  id: string;
  name: string;
  description?: string;
}

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'unknown';

export interface CsvColumn {
  name: string;
  type: ColumnType;
  rawType?: string; // Original DuckDB type string
  format?: 'json' | 'serialized' | 'text';
  sampleValues: string[];
}

export interface CsvSchema {
  columns: CsvColumn[];
  rowCount: number;
}

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';

export interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  sql: string;
  result: QueryResult;
  timestamp: number;
  executionTime: number;
}
