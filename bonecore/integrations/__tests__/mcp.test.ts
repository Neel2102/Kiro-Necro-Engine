import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { retryWithBackoff } from '../src/retry.js';

describe('Property 17: MCP error handling', () => {
  it('retries up to the configured limit with backoff on errors', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 3 }), async (retries) => {
        let attempts = 0;
        const failing = async () => {
          attempts += 1;
          throw new Error('boom');
        };

        await expect(
          retryWithBackoff(failing, { retries, baseDelayMs: 1 })
        ).rejects.toThrow('boom');

        // attempts = initial try + retries
        expect(attempts).toBe(retries + 1);
      }),
      { numRuns: 25 }
    );
  });
});

