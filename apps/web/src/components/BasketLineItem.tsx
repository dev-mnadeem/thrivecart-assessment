import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCents } from '../lib/money';
import { swatchClass } from '../lib/widgetStyle';
import type { Product, QuoteLine } from '../types/api';

interface BasketLineItemProps {
  product: Product;
  quantity: number;
  /** The server's priced line, if the current quote already reflects this quantity. */
  pricedLine: QuoteLine | undefined;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

const iconButton =
  'inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100';

export function BasketLineItem({
  product,
  quantity,
  pricedLine,
  onIncrement,
  onDecrement,
  onRemove,
}: BasketLineItemProps) {
  return (
    // Two lines per item: the basket panel is at most 400px wide, too narrow to fit the
    // name, unit price, quantity controls, line price and remove button side by side.
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-1.5 size-3 shrink-0 rounded-full ${swatchClass(product.code)}`} />
        <p className="min-w-0 flex-1 font-medium break-words">{product.name}</p>
        <p className="shrink-0 text-right font-medium tabular-nums">
          {pricedLine ? formatCents(pricedLine.lineSubtotalCents) : <span className="text-slate-400">…</span>}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pl-6">
        <p className="min-w-24 text-sm text-slate-500">{formatCents(product.priceCents)} each</p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5" role="group" aria-label={`${product.name} quantity`}>
            <button
              type="button"
              onClick={onDecrement}
              aria-label={`Remove one ${product.name}`}
              className={iconButton}
            >
              <Minus aria-hidden="true" className="size-4" />
            </button>
            <span className="w-7 text-center font-medium tabular-nums" aria-label={`Quantity ${quantity}`}>
              {quantity}
            </span>
            <button type="button" onClick={onIncrement} aria-label={`Add one ${product.name}`} className={iconButton}>
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove all ${product.name} from basket`}
            className={`${iconButton} border-transparent text-slate-500 hover:text-red-700`}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
