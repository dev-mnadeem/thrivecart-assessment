import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuote, isAbortError } from '../lib/api';
import type { ProductCode, Quote } from '../types/api';

export interface BasketEntry {
  code: ProductCode;
  quantity: number;
}

export type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BasketState {
  /** Basket contents in the order products were first added. */
  entries: BasketEntry[];
  /** Latest server quote. Kept while a newer quote loads so totals don't jump around. */
  quote: Quote | null;
  quoteStatus: QuoteStatus;
  quoteError: string | null;
  itemCount: number;
  quantityOf: (code: ProductCode) => number;
  add: (code: ProductCode) => void;
  decrement: (code: ProductCode) => void;
  remove: (code: ProductCode) => void;
  clear: () => void;
  retryQuote: () => void;
}

/** Outcome of the most recent quote request, tagged with the basket it priced. */
type QuoteResult = { key: string; quote: Quote } | { key: string; error: string };

/**
 * Holds basket quantities on the client and asks the API to price them after every change.
 *
 * Every change aborts the in-flight request, and results are tagged with the basket they
 * priced, so a slow, stale response can never be shown as the current basket's quote.
 */
export function useBasket(): BasketState {
  const [entries, setEntries] = useState<BasketEntry[]>([]);
  const [lastQuote, setLastQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const items = useMemo(
    () => entries.flatMap((entry) => Array<ProductCode>(entry.quantity).fill(entry.code)),
    [entries],
  );
  const requestKey = `${items.join(',')}#${attempt}`;

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const controller = new AbortController();

    fetchQuote(items, controller.signal)
      .then((quote) => {
        setLastQuote(quote);
        setResult({ key: requestKey, quote });
      })
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          setResult({
            key: requestKey,
            error: error instanceof Error ? error.message : 'Could not price your basket.',
          });
        }
      });

    return () => controller.abort();
  }, [items, requestKey]);

  const update = useCallback((next: BasketEntry[]) => {
    setEntries(next);

    if (next.length === 0) {
      setLastQuote(null);
    }
  }, []);

  const add = useCallback(
    (code: ProductCode) =>
      update(
        entries.some((entry) => entry.code === code)
          ? entries.map((entry) => (entry.code === code ? { ...entry, quantity: entry.quantity + 1 } : entry))
          : [...entries, { code, quantity: 1 }],
      ),
    [entries, update],
  );

  const decrement = useCallback(
    (code: ProductCode) =>
      update(
        entries
          .map((entry) => (entry.code === code ? { ...entry, quantity: entry.quantity - 1 } : entry))
          .filter((entry) => entry.quantity > 0),
      ),
    [entries, update],
  );

  const remove = useCallback(
    (code: ProductCode) => update(entries.filter((entry) => entry.code !== code)),
    [entries, update],
  );

  const clear = useCallback(() => update([]), [update]);

  const retryQuote = useCallback(() => setAttempt((value) => value + 1), []);

  const quantityOf = useCallback(
    (code: ProductCode) => entries.find((entry) => entry.code === code)?.quantity ?? 0,
    [entries],
  );

  const current = result?.key === requestKey ? result : null;
  let quoteStatus: QuoteStatus = 'loading';

  if (items.length === 0) {
    quoteStatus = 'idle';
  } else if (current) {
    quoteStatus = 'quote' in current ? 'ready' : 'error';
  }

  return {
    entries,
    quote: items.length === 0 ? null : lastQuote,
    quoteStatus,
    quoteError: current && 'error' in current ? current.error : null,
    itemCount: items.length,
    quantityOf,
    add,
    decrement,
    remove,
    clear,
    retryQuote,
  };
}
