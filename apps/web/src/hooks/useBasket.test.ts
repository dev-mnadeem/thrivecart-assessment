import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { quotes } from '../test/fixtures';
import { json, mockApi } from '../test/mockApi';
import { useBasket } from './useBasket';

describe('useBasket', () => {
  it('starts empty and idle without calling the API', () => {
    const fetchMock = mockApi();
    const { result } = renderHook(() => useBasket());

    expect(result.current.entries).toEqual([]);
    expect(result.current.quote).toBeNull();
    expect(result.current.quoteStatus).toBe('idle');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('groups quantities in first-added order and sends one code per unit', async () => {
    const fetchMock = mockApi();
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('B01');
    });
    act(() => {
      result.current.add('R01');
    });
    act(() => {
      result.current.add('B01');
    });

    expect(result.current.entries).toEqual([
      { code: 'B01', quantity: 2 },
      { code: 'R01', quantity: 1 },
    ]);
    expect(result.current.itemCount).toBe(3);
    expect(result.current.quantityOf('B01')).toBe(2);
    expect(result.current.quantityOf('G01')).toBe(0);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/basket/quote',
        expect.objectContaining({ body: JSON.stringify({ items: ['B01', 'B01', 'R01'] }) }),
      );
    });
  });

  it('reports loading, then the server quote', async () => {
    mockApi();
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('B01');
    });

    expect(result.current.quoteStatus).toBe('loading');
    await waitFor(() => {
      expect(result.current.quoteStatus).toBe('ready');
    });
    expect(result.current.quote).toEqual(quotes.B01);
  });

  it('aborts the previous request when the basket changes', async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = mockApi();
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('R01');
    });
    act(() => {
      result.current.add('R01');
    });

    await waitFor(() => {
      expect(result.current.quote?.totalCents).toBe(5437);
    });

    for (const [, init] of fetchMock.mock.calls) {
      if (init?.signal) {
        signals.push(init.signal);
      }
    }

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('surfaces quote errors and retries', async () => {
    let failing = true;
    mockApi({
      quoteResponse: () =>
        failing
          ? Promise.resolve(json({ error: { code: 'INTERNAL_ERROR', message: 'Pricing is unavailable.' } }, 500))
          : undefined,
    });
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('B01');
    });

    await waitFor(() => {
      expect(result.current.quoteStatus).toBe('error');
    });
    expect(result.current.quoteError).toBe('Pricing is unavailable.');

    failing = false;
    act(() => {
      result.current.retryQuote();
    });

    await waitFor(() => {
      expect(result.current.quoteStatus).toBe('ready');
    });
    expect(result.current.quoteError).toBeNull();
    expect(result.current.quote?.totalCents).toBe(1290);
  });

  it('clears the quote when the basket empties', async () => {
    mockApi();
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('B01');
    });
    await waitFor(() => {
      expect(result.current.quoteStatus).toBe('ready');
    });

    act(() => {
      result.current.decrement('B01');
    });

    expect(result.current.entries).toEqual([]);
    expect(result.current.quote).toBeNull();
    expect(result.current.quoteStatus).toBe('idle');
  });

  it('stops growing at the API limit', async () => {
    const fetchMock = mockApi();
    const initialProps: { max?: number } = { max: 2 };
    const { result, rerender } = renderHook(({ max }) => useBasket(max), { initialProps });

    act(() => {
      result.current.add('R01');
    });
    expect(result.current.isFull).toBe(false);

    act(() => {
      result.current.add('R01');
    });
    expect(result.current.isFull).toBe(true);

    act(() => {
      result.current.add('B01');
    });
    expect(result.current.entries).toEqual([{ code: 'R01', quantity: 2 }]);
    expect(result.current.itemCount).toBe(2);
    await waitFor(() => {
      expect(result.current.quote?.totalCents).toBe(5437);
    });
    const sentBodies = fetchMock.mock.calls.map(([, init]) => (typeof init?.body === 'string' ? init.body : ''));
    expect(sentBodies.some((body) => body.includes('B01'))).toBe(false);

    act(() => {
      result.current.decrement('R01');
    });
    expect(result.current.isFull).toBe(false);

    rerender({ max: undefined });
    expect(result.current.maxItems).toBeUndefined();
    expect(result.current.isFull).toBe(false);
  });

  it('marks client errors as not retryable', async () => {
    mockApi({
      quoteResponse: () =>
        Promise.resolve(json({ error: { code: 'INVALID_PRODUCT', message: 'Unknown product code: XYZ' } }, 422)),
    });
    const { result } = renderHook(() => useBasket());

    act(() => {
      result.current.add('XYZ');
    });

    await waitFor(() => {
      expect(result.current.quoteStatus).toBe('error');
    });
    expect(result.current.quoteError).toBe('Unknown product code: XYZ');
    expect(result.current.quoteErrorRetryable).toBe(false);
  });
});
