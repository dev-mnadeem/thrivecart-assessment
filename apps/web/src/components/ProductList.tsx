import type { ProductsState } from '../hooks/useProducts';
import type { ProductCode } from '../types/api';
import { ErrorNotice } from './ErrorNotice';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  state: ProductsState;
  onRetry: () => void;
  quantityOf: (code: ProductCode) => number;
  onAdd: (code: ProductCode) => void;
  /** False when the basket is full. */
  canAdd?: boolean;
}

const grid = 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3';

export function ProductList({ state, onRetry, quantityOf, onAdd, canAdd = true }: ProductListProps) {
  if (state.status === 'loading') {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          Loading products…
        </p>
        <ul className={grid} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li
              key={index}
              className="h-60 animate-pulse rounded-2xl border border-slate-200 bg-white motion-reduce:animate-none"
            />
          ))}
        </ul>
      </div>
    );
  }

  if (state.status === 'error') {
    return <ErrorNotice message={state.message} onRetry={state.retryable ? onRetry : undefined} />;
  }

  if (state.products.length === 0) {
    return <p className="text-slate-500">No products are available right now.</p>;
  }

  return (
    <ul className={grid}>
      {state.products.map((product) => (
        <ProductCard
          key={product.code}
          product={product}
          quantityInBasket={quantityOf(product.code)}
          canAdd={canAdd}
          onAdd={() => onAdd(product.code)}
        />
      ))}
    </ul>
  );
}
