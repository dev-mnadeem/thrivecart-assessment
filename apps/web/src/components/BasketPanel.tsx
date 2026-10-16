import { LoaderCircle, PackageOpen, ShoppingBasket } from 'lucide-react';
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
  const isUpdating = quoteStatus === 'loading';

  return (
    <section
      id="basket"
      aria-labelledby="basket-heading"
      className="self-start rounded-2xl border border-slate-200 bg-white p-5 shadow-sm scroll-mt-4 lg:sticky lg:top-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="basket-heading" className="flex items-center gap-2 text-lg font-semibold">
          <ShoppingBasket aria-hidden="true" className="size-5 text-indigo-600" />
          Basket
          <span className="text-sm font-normal text-slate-500">
            ({basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'})
          </span>
        </h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={basket.clear}
            className="rounded text-sm text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            Empty basket
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <PackageOpen aria-hidden="true" className="size-10 text-slate-300" />
          <p className="mt-3 font-medium">Your basket is empty.</p>
          <p className="mt-1 text-sm text-slate-500">Add a widget to see your total.</p>
        </div>
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

          <div className="mt-2 border-t border-slate-200 pt-4">
            {quoteStatus === 'error' && quoteError ? (
              <ErrorNotice message={quoteError} onRetry={basket.retryQuote} retryLabel="Retry pricing" />
            ) : quote ? (
              <div aria-busy={isUpdating} className={isUpdating ? 'opacity-60 transition-opacity' : undefined}>
                <PriceSummary quote={quote} />
              </div>
            ) : null}

            {isUpdating && (
              <p role="status" className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                Updating total…
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
