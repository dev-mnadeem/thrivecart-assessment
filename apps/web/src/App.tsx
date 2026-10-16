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
      <header className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <p className="font-condensed flex items-center gap-2.5 text-lg font-extrabold tracking-wide uppercase">
            <span aria-hidden="true" className="flex gap-1">
              <span className="size-2.5 rounded-full bg-red-500" />
              <span className="size-2.5 rounded-full bg-green-500" />
              <span className="size-2.5 rounded-full bg-blue-500" />
            </span>
            Acme Widget Co.
          </p>
          <a
            href="#basket"
            className="text-paper/85 hover:text-paper flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-white/10"
          >
            <ShoppingBasket aria-hidden="true" className="size-4" />
            <span aria-live="polite" className="font-mono">
              {basket.itemCount} {basket.itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="sr-only">in basket, go to basket</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <p className="text-signal font-mono text-xs tracking-widest uppercase">Price list</p>
        <h1 className="font-condensed mt-1 text-4xl font-extrabold tracking-tight sm:text-5xl">Widgets</h1>
        <p className="text-muted mt-2 max-w-prose">
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
