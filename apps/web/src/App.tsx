import { ShoppingBasket } from 'lucide-react';
import { BasketPanel } from './components/BasketPanel';
import { ProductList } from './components/ProductList';
import { useBasket } from './hooks/useBasket';
import { useProducts } from './hooks/useProducts';

export default function App() {
  const products = useProducts();
  const basket = useBasket(products.status === 'ready' ? products.maxBasketItems : undefined);

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-lg font-semibold tracking-tight">Acme Widget Co</p>
          <a
            href="#basket"
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <ShoppingBasket aria-hidden="true" className="size-4" />
            <span aria-live="polite">
              {basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="sr-only">in basket, go to basket</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Widgets</h1>
        <p className="mt-1 text-slate-600">
          Add widgets to your basket. Offers and delivery are applied automatically.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section aria-labelledby="products-heading">
            <h2 id="products-heading" className="sr-only">
              Products
            </h2>
            <ProductList
              state={products}
              onRetry={products.retry}
              quantityOf={basket.quantityOf}
              onAdd={basket.add}
              canAdd={!basket.isFull}
            />
          </section>

          <BasketPanel basket={basket} products={products.status === 'ready' ? products.products : []} />
        </div>
      </main>
    </>
  );
}
