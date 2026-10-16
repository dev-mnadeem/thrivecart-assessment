import { ShoppingBasket } from 'lucide-react';
import type { BasketState } from '../hooks/useBasket';
import type { Product } from '../types/api';
import { BasketLineItem } from './BasketLineItem';
import { ErrorNotice } from './ErrorNotice';
import { PriceSummary } from './PriceSummary';

interface BasketPanelProps {
  basket: BasketState;
  products: Product[];
}

export function BasketPanel({ basket, products }: BasketPanelProps) {
  const { entries, quote, quoteStatus, quoteError } = basket;

  return (
    <section aria-labelledby="basket-heading" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 id="basket-heading" className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingBasket aria-hidden="true" className="size-5" />
          Basket
          <span className="text-sm font-normal text-slate-500">
            ({basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'})
          </span>
        </h2>
        {entries.length > 0 && (
          <button type="button" onClick={basket.clear} className="text-sm text-slate-600 underline-offset-2 hover:underline">
            Empty basket
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="mt-6 text-center text-slate-500">Your basket is empty. Add a widget to get started.</p>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-slate-100">
            {entries.map((entry) => {
              const product = products.find((candidate) => candidate.code === entry.code);

              if (!product) {
                return null;
              }

              const pricedLine = quote?.items.find(
                (line) => line.code === entry.code && line.quantity === entry.quantity,
              );

              return (
                <BasketLineItem
                  key={entry.code}
                  product={product}
                  quantity={entry.quantity}
                  pricedLine={pricedLine}
                  onIncrement={() => basket.add(entry.code)}
                  onDecrement={() => basket.decrement(entry.code)}
                  onRemove={() => basket.remove(entry.code)}
                />
              );
            })}
          </ul>

          <div className="mt-4 border-t border-slate-200 pt-4">
            {quoteStatus === 'error' && quoteError ? (
              <ErrorNotice message={quoteError} onRetry={basket.retryQuote} retryLabel="Retry pricing" />
            ) : quote ? (
              <div aria-busy={quoteStatus === 'loading'} className={quoteStatus === 'loading' ? 'opacity-60' : undefined}>
                <PriceSummary quote={quote} />
              </div>
            ) : null}

            {quoteStatus === 'loading' && (
              <p role="status" className="mt-2 text-sm text-slate-500">
                Updating total…
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
