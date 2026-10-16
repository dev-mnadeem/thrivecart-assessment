import { Plus } from 'lucide-react';
import { formatCents } from '../lib/money';
import { swatchClass } from '../lib/widgetStyle';
import type { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  quantityInBasket: number;
  onAdd: () => void;
}

export function ProductCard({ product, quantityInBasket, onAdd }: ProductCardProps) {
  return (
    <li className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true" className={`size-10 rounded-xl ${swatchClass(product.code)}`} />
        {quantityInBasket > 0 && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
            {quantityInBasket} in basket
          </span>
        )}
      </div>

      <h3 className="mt-4 font-semibold">{product.name}</h3>
      <p className="text-sm text-slate-500">Code {product.code}</p>

      <p className="mt-3 text-2xl font-semibold tabular-nums">{formatCents(product.priceCents)}</p>

      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${product.name} to basket`}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add to basket
      </button>
    </li>
  );
}
