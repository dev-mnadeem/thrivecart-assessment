import { useBasket } from './hooks/useBasket';
import { useProducts } from './hooks/useProducts';
import { formatCents } from './lib/money';

export default function App() {
  const products = useProducts();
  const basket = useBasket();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Acme Widget Co</h1>

      <section aria-labelledby="products-heading" className="mt-8">
        <h2 id="products-heading" className="text-xl font-semibold">
          Products
        </h2>

        {products.status === 'loading' && <p role="status">Loading products…</p>}

        {products.status === 'error' && (
          <div role="alert">
            <p>{products.message}</p>
            <button type="button" onClick={products.retry}>
              Try again
            </button>
          </div>
        )}

        {products.status === 'ready' && (
          <ul className="mt-4 space-y-2">
            {products.products.map((product) => (
              <li key={product.code} className="flex items-center gap-4">
                <span>
                  {product.name} ({product.code}) — {formatCents(product.priceCents)}
                </span>
                <button type="button" onClick={() => basket.add(product.code)}>
                  Add {product.name} to basket
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="basket-heading" className="mt-8">
        <h2 id="basket-heading" className="text-xl font-semibold">
          Basket
        </h2>

        {basket.itemCount === 0 && <p>Your basket is empty.</p>}
        {basket.quoteStatus === 'loading' && <p role="status">Updating total…</p>}
        {basket.quoteStatus === 'error' && (
          <div role="alert">
            <p>{basket.quoteError}</p>
            <button type="button" onClick={basket.retryQuote}>
              Retry
            </button>
          </div>
        )}
        {basket.quote && basket.itemCount > 0 && (
          <p>
            Total: <strong data-testid="basket-total">{formatCents(basket.quote.totalCents)}</strong>
          </p>
        )}
      </section>
    </main>
  );
}
