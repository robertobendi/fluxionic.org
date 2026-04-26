import { describe, expect, it, vi, beforeEach } from 'vitest';

const dbMock = vi.hoisted(() => {
  const valuesSpy = vi.fn().mockResolvedValue(undefined);
  const insertSpy = vi.fn(() => ({ values: valuesSpy }));
  return { valuesSpy, insertSpy };
});

vi.mock('../../shared/database/index.js', () => ({
  db: { insert: dbMock.insertSpy },
}));

vi.mock('../../shared/database/schema.js', () => ({
  pageview: { __table: 'pageview' },
}));

import {
  resolveCountry,
  extractReferrerDomain,
  generateVisitorHash,
  recordPageview,
  setConfig,
} from './metrics.service.js';

beforeEach(() => {
  dbMock.insertSpy.mockClear();
  dbMock.valuesSpy.mockClear();
  setConfig({ METRICS_SALT: 'test-salt' });
});

describe('resolveCountry', () => {
  it('returns ISO 3166-1 alpha-2 for a known public IPv4', () => {
    expect(resolveCountry('8.8.8.8')).toBe('US');
  });

  it('returns ISO code for a known public IPv6', () => {
    expect(resolveCountry('2001:4860:4860::8888')).toBe('US');
  });

  it('returns null for loopback IP', () => {
    expect(resolveCountry('127.0.0.1')).toBeNull();
  });

  it('returns null for private RFC1918 IP', () => {
    expect(resolveCountry('10.0.0.1')).toBeNull();
  });

  it('returns null when IP is undefined', () => {
    expect(resolveCountry(undefined)).toBeNull();
  });

  it('returns null when IP is an empty string', () => {
    expect(resolveCountry('')).toBeNull();
  });

  it('returns null for a malformed IP without throwing', () => {
    expect(() => resolveCountry('not-an-ip')).not.toThrow();
    expect(resolveCountry('not-an-ip')).toBeNull();
  });
});

describe('extractReferrerDomain', () => {
  it('extracts hostname from a full URL', () => {
    expect(extractReferrerDomain('https://google.com/search?q=foo')).toBe('google.com');
  });

  it('strips paths and query params', () => {
    expect(extractReferrerDomain('https://news.ycombinator.com/item?id=42')).toBe(
      'news.ycombinator.com',
    );
  });

  it('returns null for undefined referrer', () => {
    expect(extractReferrerDomain(undefined)).toBeNull();
  });

  it('returns null for malformed URL', () => {
    expect(extractReferrerDomain('not a url')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractReferrerDomain('')).toBeNull();
  });
});

describe('generateVisitorHash', () => {
  it('produces a 64-char hex digest', () => {
    const hash = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns the same hash for the same inputs on the same day', () => {
    const a = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    const b = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    expect(a).toBe(b);
  });

  it('returns different hashes for different IPs', () => {
    const a = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    const b = generateVisitorHash('5.6.7.8', 'Mozilla/5.0');
    expect(a).not.toBe(b);
  });

  it('returns different hashes when the salt changes', () => {
    setConfig({ METRICS_SALT: 'salt-a' });
    const a = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    setConfig({ METRICS_SALT: 'salt-b' });
    const b = generateVisitorHash('1.2.3.4', 'Mozilla/5.0');
    expect(a).not.toBe(b);
  });

  it('handles undefined user agent', () => {
    expect(() => generateVisitorHash('1.2.3.4', undefined)).not.toThrow();
  });
});

describe('recordPageview', () => {
  it('inserts a row with country resolved from the IP', async () => {
    await recordPageview({
      path: '/about',
      ip: '8.8.8.8',
      userAgent: 'Mozilla/5.0',
    });

    expect(dbMock.valuesSpy).toHaveBeenCalledTimes(1);
    expect(dbMock.valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/about',
        country: 'US',
        referrerDomain: null,
        visitorHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    );
  });

  it('stores null country for loopback IPs (does not block insert)', async () => {
    await recordPageview({
      path: '/',
      ip: '127.0.0.1',
      userAgent: 'curl/8.0',
    });

    expect(dbMock.valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        country: null,
      }),
    );
  });

  it('stores referrerDomain when referrer is provided', async () => {
    await recordPageview({
      path: '/landing',
      referrer: 'https://twitter.com/some/path',
      ip: '8.8.8.8',
      userAgent: 'Mozilla/5.0',
    });

    expect(dbMock.valuesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        referrerDomain: 'twitter.com',
        country: 'US',
      }),
    );
  });

  it('never persists the raw IP address', async () => {
    await recordPageview({
      path: '/secret',
      ip: '203.0.113.42',
      userAgent: 'Mozilla/5.0',
    });

    const inserted = dbMock.valuesSpy.mock.calls[0][0];
    const serialised = JSON.stringify(inserted);
    expect(serialised).not.toContain('203.0.113.42');
  });

  it('never persists the user agent string', async () => {
    const ua = 'Mozilla/5.0 (X11; Linux x86_64) UNIQUE-MARKER-9b3a';
    await recordPageview({
      path: '/',
      ip: '8.8.8.8',
      userAgent: ua,
    });

    const inserted = dbMock.valuesSpy.mock.calls[0][0];
    const serialised = JSON.stringify(inserted);
    expect(serialised).not.toContain('UNIQUE-MARKER-9b3a');
  });

  it('generates a unique id for each pageview', async () => {
    await recordPageview({ path: '/', ip: '8.8.8.8', userAgent: 'a' });
    await recordPageview({ path: '/', ip: '8.8.8.8', userAgent: 'a' });

    const id1 = dbMock.valuesSpy.mock.calls[0][0].id;
    const id2 = dbMock.valuesSpy.mock.calls[1][0].id;
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
