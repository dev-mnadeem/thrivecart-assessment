import { vi } from 'vitest';
import type { Product, Quote } from '../types/api';
import { products as defaultProducts, quotes as defaultQuotes } from './fixtures';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal | null | undefined): Promise<T> {
  return new Promise((resolve, reject) => {
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    promise.then(resolve, reject);
  });
}

interface MockApiOptions {
  products?: Product[];
  maxBasketItems?: number;
  quotes?: Record<string, Quote>;
  /** Override the quote response for a basket, e.g. to delay it or return an error. */
  quoteResponse?: (items: string[]) => Promise<Response> | undefined;
  productsResponse?: () => Promise<Response> | undefined;
}

/** Stubs global fetch with an in-memory version of the PHP API. */
export function mockApi(options: MockApiOptions = {}) {
  const products = options.products ?? defaultProducts;
  const maxBasketItems = options.maxBasketItems ?? 100;
  const quotes = options.quotes ?? defaultQuotes;

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url === '/api/products') {
      return abortable(
        options.productsResponse?.() ?? Promise.resolve(json({ products, maxBasketItems })),
        init?.signal,
      );
    }

    if (url === '/api/basket/quote') {
      const { items } = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as { items: string[] };
      const custom = options.quoteResponse?.(items);

      if (custom) {
        return abortable(custom, init?.signal);
      }

      const quote = quotes[items.join(',')];

      // Baskets without a fixture stay pending; the next basket change aborts them.
      return abortable(quote ? Promise.resolve(json(quote)) : new Promise<Response>(() => undefined), init?.signal);
    }

    return json({ error: { code: 'NOT_FOUND', message: 'Not found' } }, 404);
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

export { json };
