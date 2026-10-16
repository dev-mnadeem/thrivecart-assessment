import { Plus } from 'lucide-react';
import { formatCents } from '../lib/money';
import type { Product } from '../types/api';
import { WidgetSwatch } from './WidgetSwatch';

interface ProductCardProps {
  product: Product;
  quantityInBasket: number;
  canAdd: boolean;
  onAdd: () => void;
}

/** One line of the price list: on small screens the price and button wrap under the name. */
export function ProductCard({ product, quantityInBasket, canAdd, onAdd }: ProductCardProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:flex-nowrap sm:px-5">
      <WidgetSwatch code={product.code} size="lg" />

      <div className="min-w-0 flex-1">
        <h3 className="font-condensed text-lg font-bold">{product.name}</h3>
        <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-mono">Code {product.code}</span>
          {quantityInBasket > 0 && (
            <span className="bg-signal-soft text-signal-dark rounded-full px-2 py-0.5 text-xs font-medium">
              {quantityInBasket} in basket
            </span>
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
        <p className="font-mono text-xl font-medium tabular-nums">{formatCents(product.priceCents)}</p>

        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          aria-label={`Add ${product.name} to basket`}
          className="bg-signal hover:bg-signal-dark active:bg-ink inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors disabled:bg-stone-300 disabled:text-stone-600"
        >
          <Plus aria-hidden="true" className="size-4" />
          Add
        </button>
      </div>
    </li>
  );
}
