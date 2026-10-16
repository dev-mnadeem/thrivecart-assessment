import { Tag, Truck } from 'lucide-react';
import { formatCents } from '../lib/money';
import type { Quote } from '../types/api';

interface PriceSummaryProps {
  quote: Quote;
}

export function PriceSummary({ quote }: PriceSummaryProps) {
  const freeDelivery = quote.deliveryCents === 0;

  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Subtotal</dt>
          <dd data-testid="subtotal" className="font-mono tabular-nums">
            {formatCents(quote.subtotalCents)}
          </dd>
        </div>

        {quote.appliedOffers.map((offer) => (
          <div key={offer.label} className="flex justify-between gap-4 text-green-800">
            <dt>{offer.label}</dt>
            <dd className="shrink-0 font-mono tabular-nums">−{formatCents(offer.discountCents)}</dd>
          </div>
        ))}

        <div className="flex justify-between gap-4">
          <dt className="text-muted">Delivery</dt>
          <dd
            data-testid="delivery"
            className={freeDelivery ? 'font-semibold text-green-800' : 'font-mono tabular-nums'}
          >
            {freeDelivery ? 'Free' : formatCents(quote.deliveryCents)}
          </dd>
        </div>

        <div className="border-ink flex items-baseline justify-between gap-4 border-t-2 pt-3 text-lg font-bold">
          <dt>Total</dt>
          <dd data-testid="basket-total" className="font-mono text-2xl font-medium tabular-nums">
            {formatCents(quote.totalCents)}
          </dd>
        </div>
      </dl>

      {(quote.discountCents > 0 || freeDelivery) && (
        <ul className="space-y-1.5 rounded-lg bg-green-50 p-3 text-sm text-green-900 ring-1 ring-green-700/15 ring-inset">
          {quote.discountCents > 0 && (
            <li className="flex items-center gap-2">
              <Tag aria-hidden="true" className="size-4 shrink-0" />
              You're saving {formatCents(quote.discountCents)} with offers.
            </li>
          )}
          {freeDelivery && (
            <li className="flex items-center gap-2">
              <Truck aria-hidden="true" className="size-4 shrink-0" />
              Your order qualifies for free delivery.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
