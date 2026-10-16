import { describe, expect, it, vi } from 'vitest';
import { json } from '../test/mockApi';
import { ApiError, fetchProducts, fetchQuote } from './api';

describe('api client', () => {
  it('fetches products', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ products: [{ code: 'B01', name: 'Blue Widget', priceCents: 795 }] })));

    await expect(fetchProducts()).resolves.toEqual([{ code: 'B01', name: 'Blue Widget', priceCents: 795 }]);
  });

  it('posts product codes for a quote', async () => {
    const fetchMock = vi.fn(async () => json({ totalCents: 5437 }));
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
      vi.fn(async () => json({ error: { code: 'INVALID_PRODUCT', message: 'Unknown product code: XYZ' } }, 422)),
    );

    await expect(fetchQuote(['XYZ'])).rejects.toMatchObject({
      name: 'ApiError',
      code: 'INVALID_PRODUCT',
      status: 422,
      message: 'Unknown product code: XYZ',
    });
  });

  it('handles non-JSON error responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<h1>Bad gateway</h1>', { status: 502 })));

    await expect(fetchProducts()).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 502 });
  });

  it('reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));

    const error = await fetchProducts().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', status: null });
  });
});
