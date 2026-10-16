import { useCallback, useEffect, useState } from 'react';
import { fetchProducts, isAbortError } from '../lib/api';
import type { Product } from '../types/api';

export type ProductsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; products: Product[] };

export function useProducts(): ProductsState & { retry: () => void } {
  const [state, setState] = useState<ProductsState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then((products) => setState({ status: 'ready', products }))
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setState({ status: 'error', message: error instanceof Error ? error.message : 'Could not load products.' });
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
