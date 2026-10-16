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

const sheet = 'divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-card shadow-sm';

export function ProductList({ state, onRetry, quantityOf, onAdd, canAdd = true }: ProductListProps) {
  if (state.status === 'loading') {
    return (
      <div aria-busy="true">
        <p role="status" className="sr-only">
          Loading products…
        </p>
        <ul className={sheet} aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <li key={index} className="flex items-center gap-4 p-4 sm:px-5">
              <span className="bg-rule size-12 animate-pulse rounded-xl motion-reduce:animate-none" />
              <span className="bg-rule h-5 flex-1 animate-pulse rounded motion-reduce:animate-none" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (state.status === 'error') {
    return <ErrorNotice message={state.message} onRetry={state.retryable ? onRetry : undefined} />;
  }

  if (state.products.length === 0) {
    return (
      <p className="border-rule text-muted rounded-xl border border-dashed p-6">No products are available right now.</p>
    );
  }

  return (
    <ul className={sheet}>
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
