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
          <dt className="text-slate-600">Subtotal</dt>
          <dd data-testid="subtotal" className="tabular-nums">
            {formatCents(quote.subtotalCents)}
          </dd>
        </div>

        {quote.appliedOffers.map((offer) => (
          <div key={offer.label} className="flex justify-between gap-4 text-emerald-700">
            <dt>{offer.label}</dt>
            <dd className="shrink-0 tabular-nums">−{formatCents(offer.discountCents)}</dd>
          </div>
        ))}

        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">Delivery</dt>
          <dd data-testid="delivery" className={freeDelivery ? 'font-medium text-emerald-700' : 'tabular-nums'}>
            {freeDelivery ? 'Free' : formatCents(quote.deliveryCents)}
          </dd>
        </div>

        <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd data-testid="basket-total" className="tabular-nums">
            {formatCents(quote.totalCents)}
          </dd>
        </div>
      </dl>

      {(quote.discountCents > 0 || freeDelivery) && (
        <ul className="space-y-1.5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
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
