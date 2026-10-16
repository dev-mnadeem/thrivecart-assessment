import type { ProductsState } from '../hooks/useProducts';
import type { ProductCode } from '../types/api';
import { ErrorNotice } from './ErrorNotice';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  state: ProductsState;
  onRetry: () => void;
  quantityOf: (code: ProductCode) => number;
  onAdd: (code: ProductCode) => void;
}

export function ProductList({ state, onRetry, quantityOf, onAdd }: ProductListProps) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="text-slate-500">
        Loading products…
      </p>
    );
  }

  if (state.status === 'error') {
    return <ErrorNotice message={state.message} onRetry={onRetry} />;
  }

  if (state.products.length === 0) {
    return <p className="text-slate-500">No products are available right now.</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {state.products.map((product) => (
        <ProductCard
          key={product.code}
          product={product}
          quantityInBasket={quantityOf(product.code)}
          onAdd={() => onAdd(product.code)}
        />
      ))}
    </ul>
  );
}
