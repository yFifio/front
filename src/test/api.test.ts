import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '@/lib/api';

const createJsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

describe('apiRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sends authorization header when token exists', async () => {
    localStorage.setItem('auth_token', 'abc123');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(createJsonResponse({ ok: true }));

    await apiRequest('/products');

    const [, requestInit] = fetchMock.mock.calls[0];
    const headers = requestInit?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc123');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('uses fallback URL when primary fetch fails due to network error', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(createJsonResponse({ ok: true }));

    const data = await apiRequest('/orders');

    expect(data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/orders', expect.any(Object));
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3001/api/orders', expect.any(Object));
  });

  it('clears auth data on 401 response', async () => {
    localStorage.setItem('auth_token', 'token');
    localStorage.setItem('user_data', 'user');
    window.history.pushState({}, '', '/auth');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ error: 'unauthorized' }, { status: 401 })
    );

    await expect(apiRequest('/protected')).rejects.toThrow('unauthorized');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('returns null for 204 responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const data = await apiRequest('/empty');
    expect(data).toBeNull();
  });

  it('throws readable error message for non-ok API responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      createJsonResponse({ message: 'Falha de negócio' }, { status: 400 })
    );

    await expect(apiRequest('/bad-request')).rejects.toThrow('Falha de negócio');
  });
});
