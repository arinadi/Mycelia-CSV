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
  sampleValues: string[];
}

export interface CsvSchema {
  columns: CsvColumn[];
  rowCount: number;
}

export type ParseStatus = 'idle' | 'parsing' | 'done' | 'error';
