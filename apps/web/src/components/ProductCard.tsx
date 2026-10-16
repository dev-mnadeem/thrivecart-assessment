import { Plus } from 'lucide-react';
import { formatCents } from '../lib/money';
import type { Product } from '../types/api';

interface ProductCardProps {
  product: Product;
  quantityInBasket: number;
  onAdd: () => void;
}

export function ProductCard({ product, quantityInBasket, onAdd }: ProductCardProps) {
  return (
    <li className="flex flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{product.name}</h3>
          <p className="text-sm text-slate-500">Code {product.code}</p>
        </div>
        {quantityInBasket > 0 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {quantityInBasket} in basket
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-semibold text-slate-900">{formatCents(product.priceCents)}</p>

      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${product.name} to basket`}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
      >
        <Plus aria-hidden="true" className="size-4" />
        Add to basket
      </button>
    </li>
  );
}
