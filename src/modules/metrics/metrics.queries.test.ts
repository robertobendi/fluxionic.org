import { describe, expect, it, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => {
  // Capture the where clause args so we can assert against them.
  const calls: { whereArgs: unknown[]; limitArg: number | undefined } = {
    whereArgs: [],
    limitArg: undefined,
  };
  let nextResults: Array<{ country: string | null; visitors: number }> = [];

  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn(function (this: unknown, ...args: unknown[]) {
      calls.whereArgs = args;
      return chain;
    }),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(function (this: unknown, n: number) {
      calls.limitArg = n;
      return Promise.resolve(nextResults);
    }),
  };

  const selectSpy = vi.fn(() => chain);

  return {
    selectSpy,
    chain,
    calls,
    setResults: (rows: Array<{ country: string | null; visitors: number }>) => {
      nextResults = rows;
    },
    reset: () => {
      calls.whereArgs = [];
      calls.limitArg = undefined;
      nextResults = [];
      chain.from.mockClear();
      chain.where.mockClear();
      chain.groupBy.mockClear();
      chain.orderBy.mockClear();
      chain.limit.mockClear();
      selectSpy.mockClear();
    },
  };
});

vi.mock('../../shared/database/index.js', () => ({
  db: { select: dbMock.selectSpy },
}));

vi.mock('../../shared/database/schema.js', () => ({
  pageview: {
    country: { name: 'country' },
    visitorHash: { name: 'visitorHash' },
    createdAt: { name: 'createdAt' },
    path: { name: 'path' },
  },
}));

import { getTopCountries } from './metrics.queries.js';

beforeEach(() => {
  dbMock.reset();
});

describe('getTopCountries', () => {
  it('filters out rows with null country (defensive — index-excluded but belt-and-braces)', async () => {
    dbMock.setResults([
      { country: 'US', visitors: 42 },
      { country: null, visitors: 7 },
      { country: 'PT', visitors: 5 },
    ]);

    const result = await getTopCountries();

    expect(result).toEqual([
      { country: 'US', visitors: 42 },
      { country: 'PT', visitors: 5 },
    ]);
  });

  it('returns an empty array when there are no pageviews', async () => {
    dbMock.setResults([]);
    const result = await getTopCountries();
    expect(result).toEqual([]);
  });

  it('preserves DB ordering (visitors desc) without re-sorting', async () => {
    dbMock.setResults([
      { country: 'DE', visitors: 100 },
      { country: 'FR', visitors: 50 },
      { country: 'IT', visitors: 25 },
    ]);

    const result = await getTopCountries();

    expect(result.map((r) => r.country)).toEqual(['DE', 'FR', 'IT']);
  });

  it('uses default limit of 20 when not specified', async () => {
    dbMock.setResults([]);
    await getTopCountries();
    expect(dbMock.calls.limitArg).toBe(20);
  });

  it('honours a custom limit', async () => {
    dbMock.setResults([]);
    await getTopCountries({ limit: 5 });
    expect(dbMock.calls.limitArg).toBe(5);
  });

  it('passes a where clause to the query (combining country-not-null + time window)', async () => {
    dbMock.setResults([]);
    await getTopCountries({ days: 30 });
    // The where call should have been invoked with at least one composed expression.
    expect(dbMock.chain.where).toHaveBeenCalledTimes(1);
    expect(dbMock.calls.whereArgs.length).toBeGreaterThan(0);
  });
});
