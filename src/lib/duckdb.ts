import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB(file: File): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  // Register file
  await db.registerFileHandle(
    'data.csv',
    file,
    duckdb.DuckDBDataProtocol.BROWSER_FILEREADER,
    true
  );

  // Create view for lazy scanning
  const conn = await db.connect();
  await conn.query(`CREATE VIEW data AS SELECT * FROM read_csv_auto('data.csv')`);
  await conn.close();

  return db;
}

export async function runQuery(sql: string) {
  if (!db) throw new Error('DuckDB not initialized');
  
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    const rows = result.toArray().map((r) => r.toJSON() as Record<string, unknown>);
    const columns = result.schema.fields.map((f) => f.name);
    return { rows, columns, rowCount: rows.length };
  } finally {
    await conn.close();
  }
}

export function getDuckDB() {
  return db;
}
