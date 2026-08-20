import { IProviderAdapter } from '../base/provider.interface';
import { mockFintechProvider } from '../mock/mock.provider';
import { logger } from '../../utils/logger';

export class ProviderSwitch {
  private primaryProvider: IProviderAdapter;
  private secondaryProvider?: IProviderAdapter;

  constructor() {
    this.primaryProvider = mockFintechProvider;
  }

  /**
   * Get active healthy provider adapter
   */
  async getActiveProvider(): Promise<IProviderAdapter> {
    try {
      const isPrimaryUp = await this.primaryProvider.isAvailable();
      if (isPrimaryUp) {
        return this.primaryProvider;
      }
    } catch (err: any) {
      logger.warn('Primary provider health check failed, evaluating fallback', { error: err.message });
    }

    if (this.secondaryProvider) {
      const isSecondaryUp = await this.secondaryProvider.isAvailable();
      if (isSecondaryUp) {
        logger.info('Routed request to secondary provider');
        return this.secondaryProvider;
      }
    }

    return this.primaryProvider;
  }
}

export const providerSwitch = new ProviderSwitch();
