import type { ApiErrorBody, Product, ProductCode, ProductsResponse, Quote, QuoteRequest } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }

  const { error } = value;

  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  let response: Response;

  try {
    response = await fetch(path, { ...init, headers });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError('Could not reach the server. Check your connection and try again.', 'NETWORK_ERROR', null);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isApiErrorBody(body)) {
      throw new ApiError(body.error.message, body.error.code, response.status);
    }

    throw new ApiError(`The server responded with ${response.status}.`, 'HTTP_ERROR', response.status);
  }

  if (body === null) {
    throw new ApiError('The server sent an unreadable response.', 'INVALID_RESPONSE', response.status);
  }

  return body as T;
}

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const body = await request<ProductsResponse>('/api/products', { method: 'GET', signal });

  return body.products;
}

export function fetchQuote(items: ProductCode[], signal?: AbortSignal): Promise<Quote> {
  const payload: QuoteRequest = { items };

  return request<Quote>('/api/basket/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
