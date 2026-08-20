import { logger } from '../utils/logger';

interface IdempotentRecord {
  key: string;
  status: 'PENDING' | 'COMPLETED';
  response?: any;
  createdAt: number;
}

class IdempotencyManager {
  private records = new Map<string, IdempotentRecord>();

  /**
   * Check if idempotency key exists or acquire lock
   */
  async acquire(key: string): Promise<{ isNew: boolean; response?: any }> {
    const existing = this.records.get(key);
    if (existing) {
      if (existing.status === 'PENDING') {
        throw new Error('A request with this Idempotency-Key is currently being processed.');
      }
      logger.info('Returning cached response for idempotency key', { key });
      return { isNew: false, response: existing.response };
    }

    // Set lock
    this.records.set(key, {
      key,
      status: 'PENDING',
      createdAt: Date.now()
    });

    return { isNew: true };
  }

  /**
   * Save finalized response for idempotency key
   */
  async saveResponse(key: string, response: any): Promise<void> {
    this.records.set(key, {
      key,
      status: 'COMPLETED',
      response,
      createdAt: Date.now()
    });
  }

  /**
   * Release key if request failed unexpectedly before completion
   */
  async release(key: string): Promise<void> {
    this.records.delete(key);
  }
}

export const idempotencyManager = new IdempotencyManager();
