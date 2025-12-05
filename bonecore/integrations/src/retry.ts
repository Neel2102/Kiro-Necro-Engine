import { Logger, createLogger } from '@necro/common';

export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  logger?: Logger;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const logger = options.logger ?? createLogger('warn');

  let attempt = 0;
  // attempt 0 + retries additional attempts
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) {
        throw error;
      }
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(`retrying after error (attempt ${attempt + 1})`, error);
      await wait(delay);
      attempt += 1;
    }
  }
};

