import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../shared/database/index.js', () => ({ db: {} }));
vi.mock('./auth.config.js', () => ({ auth: { $context: Promise.resolve({}) } }));

const accessInfo = vi.hoisted(() => ({
  getCollectionAccessInfo: vi.fn(),
}));

vi.mock('../content/collection.service.js', () => ({
  getCollectionAccessInfo: accessInfo.getCollectionAccessInfo,
}));

import {
  requireRole,
  requireCollectionAccess,
  resolveCollectionAccess,
} from './auth.service.js';

type Role = 'admin' | 'editor' | 'viewer' | 'user';

interface FakeRequest {
  user: { id: string; email: string; role: Role } | null;
  apiKey: { id: string; scopes: { read: '*' | string[]; write: '*' | string[] } } | null;
  params?: unknown;
}

function makeRequest(overrides: Partial<FakeRequest> = {}): FakeRequest {
  return {
    user: null,
    apiKey: null,
    params: {},
    ...overrides,
  };
}

function makeReply() {
  const state: { status?: number; body?: unknown } = {};
  const reply = {
    status(code: number) {
      state.status = code;
      return reply;
    },
    send(body: unknown) {
      state.body = body;
      return reply;
    },
  };
  return { reply, state };
}

async function run(handler: any, request: FakeRequest) {
  const { reply, state } = makeReply();
  await handler(request, reply);
  return state;
}

function userWithRole(role: Role): FakeRequest['user'] {
  return { id: 'u1', email: 'x@example.com', role };
}

describe('requireRole', () => {
  it.each([
    ['admin', 'admin', undefined],
    ['admin', 'editor', 403],
    ['admin', 'viewer', 403],
    ['admin', 'user', 403],
    ['editor', 'admin', undefined],
    ['editor', 'editor', undefined],
    ['editor', 'viewer', 403],
    ['editor', 'user', 403],
    ['viewer', 'admin', undefined],
    ['viewer', 'editor', undefined],
    ['viewer', 'viewer', undefined],
    ['viewer', 'user', 403],
  ] as const)(
    'requireRole(%s) with user role %s → status %s',
    async (min, actual, expected) => {
      const { status } = await run(
        requireRole(min as Role),
        makeRequest({ user: userWithRole(actual as Role) })
      );
      expect(status).toBe(expected);
    }
  );

  it('rejects unauthenticated requests with 401', async () => {
    const { status } = await run(requireRole('viewer'), makeRequest());
    expect(status).toBe(401);
  });

  it('lets API keys through on viewer-level routes', async () => {
    const { status } = await run(
      requireRole('viewer'),
      makeRequest({ apiKey: { id: 'k1', scopes: { read: '*', write: [] } } })
    );
    expect(status).toBeUndefined();
  });

  it('rejects API keys on editor-level routes (401 without user)', async () => {
    const { status } = await run(
      requireRole('editor'),
      makeRequest({ apiKey: { id: 'k1', scopes: { read: '*', write: '*' } } })
    );
    expect(status).toBe(401);
  });
});

describe('resolveCollectionAccess', () => {
  it('admin always writes regardless of permissions', () => {
    expect(
      resolveCollectionAccess({ role: 'admin' }, null, 'posts', { viewer: 'none' })
    ).toBe('write');
  });

  it('editor defaults to write when no permissions set', () => {
    expect(resolveCollectionAccess({ role: 'editor' }, null, 'posts', null)).toBe('write');
  });

  it('editor respects explicit permission override', () => {
    expect(
      resolveCollectionAccess({ role: 'editor' }, null, 'posts', { editor: 'read' })
    ).toBe('read');
  });

  it('viewer defaults to read', () => {
    expect(resolveCollectionAccess({ role: 'viewer' }, null, 'posts', null)).toBe('read');
  });

  it('viewer can be elevated to write via permissions', () => {
    expect(
      resolveCollectionAccess({ role: 'viewer' }, null, 'posts', { viewer: 'write' })
    ).toBe('write');
  });

  it('api key with matching write scope gets write', () => {
    expect(
      resolveCollectionAccess(null, { scopes: { read: '*', write: ['posts'] } }, 'posts', null)
    ).toBe('write');
  });

  it('api key with matching read scope but no write gets read', () => {
    expect(
      resolveCollectionAccess(null, { scopes: { read: ['posts'], write: [] }, }, 'posts', null)
    ).toBe('read');
  });

  it('api key with no matching scope gets none', () => {
    expect(
      resolveCollectionAccess(null, { scopes: { read: ['other'], write: [] } }, 'posts', null)
    ).toBe('none');
  });

  it('user role without admin/editor/viewer gets none', () => {
    expect(resolveCollectionAccess({ role: 'user' }, null, 'posts', null)).toBe('none');
  });
});

describe('requireCollectionAccess', () => {
  beforeEach(() => {
    accessInfo.getCollectionAccessInfo.mockReset();
  });

  it('401s when neither user nor api key is present', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({ id: 'c1', slug: 'posts', permissions: null });
    const { status } = await run(
      requireCollectionAccess('read'),
      makeRequest({ params: { collectionId: 'posts' } })
    );
    expect(status).toBe(401);
  });

  it('400s when the request has no collection identifier', async () => {
    const { status } = await run(
      requireCollectionAccess('read'),
      makeRequest({ user: userWithRole('admin'), params: {} })
    );
    expect(status).toBe(400);
  });

  it('404s when the collection does not exist', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue(null);
    const { status } = await run(
      requireCollectionAccess('read'),
      makeRequest({ user: userWithRole('admin'), params: { collectionId: 'missing' } })
    );
    expect(status).toBe(404);
  });

  it('allows admin write regardless of permissions', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({
      id: 'c1',
      slug: 'posts',
      permissions: { editor: 'read', viewer: 'none' },
    });
    const { status } = await run(
      requireCollectionAccess('write'),
      makeRequest({ user: userWithRole('admin'), params: { collectionId: 'posts' } })
    );
    expect(status).toBeUndefined();
  });

  it('rejects editor write when permissions restrict to read', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({
      id: 'c1',
      slug: 'posts',
      permissions: { editor: 'read' },
    });
    const { status } = await run(
      requireCollectionAccess('write'),
      makeRequest({ user: userWithRole('editor'), params: { collectionId: 'posts' } })
    );
    expect(status).toBe(403);
  });

  it('allows viewer read on a collection with no explicit permissions', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({ id: 'c1', slug: 'posts', permissions: null });
    const { status } = await run(
      requireCollectionAccess('read'),
      makeRequest({ user: userWithRole('viewer'), params: { collectionId: 'posts' } })
    );
    expect(status).toBeUndefined();
  });

  it('rejects viewer write even when permissions allow read', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({ id: 'c1', slug: 'posts', permissions: null });
    const { status } = await run(
      requireCollectionAccess('write'),
      makeRequest({ user: userWithRole('viewer'), params: { collectionId: 'posts' } })
    );
    expect(status).toBe(403);
  });

  it('allows api key with write scope to reach write routes', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({ id: 'c1', slug: 'posts', permissions: null });
    const { status } = await run(
      requireCollectionAccess('write'),
      makeRequest({
        apiKey: { id: 'k1', scopes: { read: '*', write: ['posts'] } },
        params: { collectionId: 'posts' },
      })
    );
    expect(status).toBeUndefined();
  });

  it('rejects api key write when slug is out of scope', async () => {
    accessInfo.getCollectionAccessInfo.mockResolvedValue({ id: 'c1', slug: 'posts', permissions: null });
    const { status } = await run(
      requireCollectionAccess('write'),
      makeRequest({
        apiKey: { id: 'k1', scopes: { read: '*', write: ['pages'] } },
        params: { collectionId: 'posts' },
      })
    );
    expect(status).toBe(403);
  });
});
