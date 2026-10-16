import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchQuote, isAbortError, isRetryable } from '../lib/api';
import { addUnit, removeLine, removeUnit, toItemCodes, type BasketEntry } from '../lib/basketEntries';
import type { ProductCode, Quote } from '../types/api';

export type { BasketEntry };

export type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface BasketState {
  /** Basket contents in the order products were first added. */
  entries: BasketEntry[];
  /** Latest server quote. Kept while a newer quote loads so totals don't jump around. */
  quote: Quote | null;
  quoteStatus: QuoteStatus;
  quoteError: string | null;
  /** Whether retrying the failed quote could help (network or server error, not a rejected basket). */
  quoteErrorRetryable: boolean;
  itemCount: number;
  /** The API's basket size limit, once known. */
  maxItems: number | undefined;
  /** True when the basket holds `maxItems` units; adding more is ignored. */
  isFull: boolean;
  quantityOf: (code: ProductCode) => number;
  add: (code: ProductCode) => void;
  decrement: (code: ProductCode) => void;
  remove: (code: ProductCode) => void;
  clear: () => void;
  retryQuote: () => void;
}

/** Outcome of the most recent quote request, tagged with the basket it priced. */
type QuoteResult = { key: string; quote: Quote } | { key: string; error: string; retryable: boolean };

/**
 * Holds basket quantities on the client and asks the API to price them after every change.
 *
 * Every change aborts the in-flight request, and results are tagged with the basket they
 * priced, so a slow, stale response can never be shown as the current basket's quote.
 *
 * `maxItems` is the API's published basket limit; the basket never grows past it, so the
 * UI does not send a quote the API is certain to reject.
 */
export function useBasket(maxItems?: number): BasketState {
  const [entries, setEntries] = useState<BasketEntry[]>([]);
  const [lastQuote, setLastQuote] = useState<Quote | null>(null);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  const items = useMemo(() => toItemCodes(entries), [entries]);
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
            retryable: isRetryable(error),
          });
        }
      });

    return () => controller.abort();
  }, [items, requestKey]);

  // Adjusting state during render (not in an effect) so an emptied basket never shows its old quote.
  if (items.length === 0 && lastQuote !== null) {
    setLastQuote(null);
  }

  const isFull = maxItems !== undefined && items.length >= maxItems;

  // Functional updates, so several changes in one batch all apply.
  const add = useCallback((code: ProductCode) => setEntries((current) => addUnit(current, code, maxItems)), [maxItems]);
  const decrement = useCallback((code: ProductCode) => setEntries((current) => removeUnit(current, code)), []);
  const remove = useCallback((code: ProductCode) => setEntries((current) => removeLine(current, code)), []);
  const clear = useCallback(() => setEntries([]), []);

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
    quoteErrorRetryable: current !== null && 'error' in current && current.retryable,
    itemCount: items.length,
    maxItems,
    isFull,
    quantityOf,
    add,
    decrement,
    remove,
    clear,
    retryQuote,
  };
}
