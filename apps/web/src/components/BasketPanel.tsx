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
      className="border-rule bg-card scroll-mt-4 self-start rounded-xl border p-5 shadow-sm lg:sticky lg:top-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="basket-heading" className="font-condensed flex items-center gap-2 text-xl font-bold">
          <ShoppingBasket aria-hidden="true" className="text-signal size-5" />
          Basket
          <span className="text-muted font-mono text-sm font-normal">
            ({basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'})
          </span>
        </h2>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={basket.clear}
            className="text-muted hover:text-ink rounded text-sm underline-offset-2 hover:underline"
          >
            Empty basket
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <PackageOpen aria-hidden="true" className="text-rule size-10" />
          <p className="mt-3 font-medium">Your basket is empty.</p>
          <p className="text-muted mt-1 text-sm">Add a widget to see your total.</p>
        </div>
      ) : (
        <>
          {basket.isFull && basket.maxItems !== undefined && (
            <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Basket limit reached: up to {basket.maxItems} items.
            </p>
          )}

          <ul className="divide-rule mt-2 divide-y">
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
                  canIncrement={!basket.isFull}
                  onIncrement={() => basket.add(entry.code)}
                  onDecrement={() => basket.decrement(entry.code)}
                  onRemove={() => basket.remove(entry.code)}
                />
              );
            })}
          </ul>

          <div className="border-rule mt-2 border-t pt-4">
            {quoteStatus === 'error' && quoteError ? (
              <ErrorNotice
                message={quoteError}
                onRetry={basket.quoteErrorRetryable ? basket.retryQuote : undefined}
                retryLabel="Retry pricing"
                hint="Adjust your basket to continue."
              />
            ) : quote ? (
              <div aria-busy={isUpdating} className={isUpdating ? 'opacity-60 transition-opacity' : undefined}>
                <PriceSummary quote={quote} />
              </div>
            ) : null}

            {isUpdating && (
              <p role="status" className="text-muted mt-3 flex items-center gap-2 text-sm">
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
