import * as duckdb from '@duckdb/duckdb-wasm';
import { sanitizeRows } from './utils';

let db: duckdb.AsyncDuckDB | null = null;

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: '/duckdb/duckdb-mvp.wasm',
    mainWorker: '/duckdb/duckdb-browser-mvp.worker.js',
  },
  eh: {
    mainModule: '/duckdb/duckdb-eh.wasm',
    mainWorker: '/duckdb/duckdb-browser-eh.worker.js',
  },
};

export async function initDuckDB(file: File): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  // 1. Select bundle based on browser feature checks
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  // 2. Instantiate the asynchronous version of DuckDB-Wasm
  const worker = new Worker(bundle.mainWorker!, { type: 'module' });
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // 3. Register data file using the Document-specified FileHandle method
  await db.registerFileHandle(
    'data.csv',
    file,
    duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
    true
  );

  // 4. Ingest data by creating a view for optimized lazy scanning
  const conn = await db.connect();
  try {
    // 5. Load essential extensions for complex parsing
    await conn.query(`LOAD json; LOAD icu;`);
    
    // OOM Mitigation for large datasets (2M+ rows)
    await conn.query(`
      SET memory_limit='3GB';
      SET threads=1;
      SET preserve_insertion_order=false;
    `);
    
    await conn.query(`CREATE VIEW data AS SELECT * FROM read_csv_auto('data.csv')`);
  } finally {
    // 6. Always close the connection to release memory per documentation guidelines
    await conn.close();
  }

  return db;
}

export async function runQuery(sql: string) {
  if (!db) throw new Error('DuckDB not initialized');
  
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const rawRows = result.toArray().map((r) => r.toJSON() as Record<string, unknown>);
    const rows = sanitizeRows(rawRows);
    const columns = result.schema.fields.map((f) => f.name);
    return { rows, columns, rowCount: rows.length };
  } finally {
    await conn.close();
  }
}

/**
 * Executes a query and returns only the metadata (columns and total row count)
 * by creating a temporary view to avoid pulling all data into memory.
 */
export async function getQueryMetadata(sql: string) {
  if (!db) throw new Error('DuckDB not initialized');
  const conn = await db.connect();
  const sanitizedSql = sql.trim().replace(/;$/, '');
  
  try {
    // 1. Create a persistent view of the results to allow access across separate connections
    await conn.query(`CREATE OR REPLACE VIEW _last_result AS ${sanitizedSql}`);
    
    // 2. Get Column names
    const descResult = await conn.query(`DESCRIBE _last_result`);
    const columns = descResult.toArray().map(r => r.toJSON().column_name as string);
    
    // 3. Get Total Count
    const countResult = await conn.query(`SELECT count(*) as total FROM _last_result`);
    const rowCount = Number(countResult.toArray()[0].toJSON().total);
    
    return { columns, rowCount };
  } finally {
    await conn.close();
  }
}

/**
 * Fetches a specific page of results from the previously created temporary view.
 */
export async function fetchPaginatedRows(limit: number, offset: number) {
  if (!db) throw new Error('DuckDB not initialized');
  const conn = await db.connect();
  try {
    const result = await conn.query(`SELECT * FROM _last_result LIMIT ${limit} OFFSET ${offset}`);
    const rawRows = result.toArray().map((r) => r.toJSON() as Record<string, unknown>);
    return sanitizeRows(rawRows);
  } finally {
    await conn.close();
  }
}

export async function getTableSchema() {
  if (!db) throw new Error('DuckDB not initialized');
  const conn = await db.connect();
  try {
    // 1. Get Column Metadata
    const descResult = await conn.query(`DESCRIBE data;`);
    const descRows = descResult.toArray().map((r) => r.toJSON() as { column_name: string; column_type: string; null: string });
    
    // 2. Get Accurate Row Count
    const countResult = await conn.query(`SELECT count(*) as total FROM data;`);
    const totalRowsCount = Number(countResult.toArray()[0].toJSON().total);

    // 3. Get Sample Data for type detection/formatting
    const sampleResult = await conn.query(`SELECT * FROM data LIMIT 100;`);
    const rawSampleRows = sampleResult.toArray().map((r) => r.toJSON());
    const sampleRows = sanitizeRows(rawSampleRows);
    
    return {
      columns: descRows.map((col) => ({
        name: col.column_name,
        type: col.column_type,
        nullable: col.null === 'YES'
      })),
      totalRows: totalRowsCount,
      sampleRows
    };
  } finally {
    await conn.close();
  }
}

export async function exportToFormat(sql: string, format: 'parquet' | 'csv'): Promise<Blob> {
  if (!db) throw new Error('DuckDB not initialized');
  
  const conn = await db.connect();
  const extension = format === 'parquet' ? 'parquet' : 'csv';
  const tempFilename = `export_${Date.now()}.${extension}`;
  const contentType = format === 'parquet' ? 'application/octet-stream' : 'text/csv';
  
  try {
    const sanitizedSql = sql.trim().replace(/;$/, '');
    const formatConfig = format === 'parquet' 
      ? '(FORMAT parquet)' 
      : '(FORMAT CSV, HEADER)';
      
    await conn.query(`COPY (${sanitizedSql}) TO '${tempFilename}' ${formatConfig}`);
    
    const buffer = await db.copyFileToBuffer(tempFilename);
    await db.dropFile(tempFilename);
    
    return new Blob([buffer as unknown as BlobPart], { type: contentType });
  } finally {
    await conn.close();
  }
}

export async function exportToParquet(sql: string): Promise<Blob> {
  return exportToFormat(sql, 'parquet');
}

export async function exportToCsv(sql: string): Promise<Blob> {
  return exportToFormat(sql, 'csv');
}

export function getDuckDB() {
  return db;
}
