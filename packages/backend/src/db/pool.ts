import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

export const pool = new Pool(config.database);

pool.on('connect', () => {
  logger.info('PostgreSQL client connected to database pool');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', { error: err.message });
});

/**
 * Execute a query with connection from pool
 */
export async function query<R extends QueryResultRow = any, I extends any[] = any[]>(
  text: string,
  params?: I
): Promise<QueryResult<R>> {
  const start = Date.now();
  try {
    const res = await pool.query<R>(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (err: any) {
    logger.error('Database query error', { text, error: err.message });
    throw err;
  }
}

/**
 * Execute a financial operation inside an ACID transaction
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connectivity
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1 as health');
    return res.rows[0]?.health === 1;
  } catch (err: any) {
    logger.warn('PostgreSQL health check failed (operating in fallback/mock mode if configured)', {
      error: err.message
    });
    return false;
  }
}
