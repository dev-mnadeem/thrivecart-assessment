import { BasketPanel } from './components/BasketPanel';
import { ProductList } from './components/ProductList';
import { useBasket } from './hooks/useBasket';
import { useProducts } from './hooks/useProducts';

export default function App() {
  const products = useProducts();
  const basket = useBasket();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Acme Widget Co</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="mb-4 text-lg font-semibold">
            Products
          </h2>
          <ProductList state={products} onRetry={products.retry} quantityOf={basket.quantityOf} onAdd={basket.add} />
        </section>

        <BasketPanel basket={basket} products={products.status === 'ready' ? products.products : []} />
      </div>
    </main>
  );
}
