import { describe, expect, it, vi } from 'vitest';
import { json } from '../test/mockApi';
import { ApiError, fetchProducts, fetchQuote, isRetryable } from './api';

describe('api client', () => {
  it('fetches products and the basket limit', async () => {
    const body = { products: [{ code: 'B01', name: 'Blue Widget', priceCents: 795 }], maxBasketItems: 100 };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(json(body))),
    );

    await expect(fetchProducts()).resolves.toEqual(body);
  });

  it('posts product codes for a quote', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json({ totalCents: 5437 })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchQuote(['R01', 'R01']);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/basket/quote',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ items: ['R01', 'R01'] }) }),
    );
  });

  it('turns API error bodies into ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(json({ error: { code: 'INVALID_PRODUCT', message: 'Unknown product code: XYZ' } }, 422)),
      ),
    );

    await expect(fetchQuote(['XYZ'])).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INVALID_PRODUCT',
      status: 422,
      message: 'Unknown product code: XYZ',
    });
  });

  it('handles non-JSON error responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<h1>Bad gateway</h1>', { status: 502 }))),
    );

    await expect(fetchProducts()).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 502 });
  });

  it('reports network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    const error = await fetchProducts().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: null });
  });

  it.each([
    ['a network failure', new ApiError('Offline', 'NETWORK_ERROR', null), true],
    ['a 500', new ApiError('Boom', 'INTERNAL_ERROR', 500), true],
    ['a 503', new ApiError('Busy', 'HTTP_ERROR', 503), true],
    ['an unexpected non-API error', new Error('Bug'), true],
    ['a 400', new ApiError('Bad JSON', 'INVALID_JSON', 400), false],
    ['a 422', new ApiError('Too many', 'TOO_MANY_ITEMS', 422), false],
  ])('treats %s as retryable: %s', (_label, error, expected) => {
    expect(isRetryable(error)).toBe(expected);
  });
});
