import { formatCents } from '../lib/money';
import type { Quote } from '../types/api';

interface PriceSummaryProps {
  quote: Quote;
}

export function PriceSummary({ quote }: PriceSummaryProps) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-slate-600">Subtotal</dt>
        <dd data-testid="subtotal">{formatCents(quote.subtotalCents)}</dd>
      </div>

      {quote.appliedOffers.map((offer) => (
        <div key={offer.label} className="flex justify-between text-emerald-700">
          <dt>{offer.label}</dt>
          <dd>−{formatCents(offer.discountCents)}</dd>
        </div>
      ))}

      <div className="flex justify-between">
        <dt className="text-slate-600">Delivery</dt>
        <dd data-testid="delivery">{quote.deliveryCents === 0 ? 'Free' : formatCents(quote.deliveryCents)}</dd>
      </div>

      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd data-testid="basket-total">{formatCents(quote.totalCents)}</dd>
      </div>
    </dl>
  );
}
