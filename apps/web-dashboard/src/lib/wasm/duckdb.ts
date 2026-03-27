import type * as DuckDB from "@duckdb/duckdb-wasm";

let dbInstance: DuckDB.AsyncDuckDB | null = null;

async function createDb(): Promise<DuckDB.AsyncDuckDB> {
    const duckdb = await import("@duckdb/duckdb-wasm");
    const bundles = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(bundles);
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return db;
}

export async function getDuckDb(): Promise<DuckDB.AsyncDuckDB> {
    if (dbInstance) return dbInstance;
    dbInstance = await createDb();
    return dbInstance;
}

export async function runDuckDbQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const db = await getDuckDb();
    const conn = await db.connect();
    try {
        const result = await conn.query(sql);
        return result.toArray() as unknown as T[];
    } finally {
        await conn.close();
    }
}
