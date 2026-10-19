import { useCallback, useEffect, useState } from 'react';
import { fetchProducts, isAbortError, isRetryable } from '../lib/api';
import type { Product } from '../types/api';

export type ProductsState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retryable: boolean }
  | { status: 'ready'; products: Product[]; maxBasketItems: number };

export function useProducts(): ProductsState & { retry: () => void } {
  const [state, setState] = useState<ProductsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then(({ products, maxBasketItems }) => setState({ status: 'ready', products, maxBasketItems }))
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Could not load products.',
            retryable: isRetryable(error),
          });
        }
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { ...state, retry };
}
