import { logger } from '../utils/logger';

class MutexLockManager {
  private activeLocks = new Map<string, number>();

  /**
   * Acquire a lock for a resource (e.g. `wallet:${walletId}`)
   * Waits up to timeoutMs if currently locked
   */
  async acquire(resourceId: string, timeoutMs = 10000): Promise<() => void> {
    const startTime = Date.now();

    while (this.activeLocks.has(resourceId)) {
      if (Date.now() - startTime > timeoutMs) {
        logger.error('Lock acquisition timeout', { resourceId });
        throw new Error(`Lock timeout for resource: ${resourceId}. Transaction in progress.`);
      }
      // Wait 50ms before polling
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.activeLocks.set(resourceId, Date.now());

    // Return release function
    return () => {
      this.activeLocks.delete(resourceId);
    };
  }
}

export const lockManager = new MutexLockManager();
