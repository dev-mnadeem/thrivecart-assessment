import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCents } from '../lib/money';
import type { Product, QuoteLine } from '../types/api';
import { WidgetSwatch } from './WidgetSwatch';

interface BasketLineItemProps {
  product: Product;
  quantity: number;
  /** The server's priced line, if the current quote already reflects this quantity. */
  pricedLine: QuoteLine | undefined;
  canIncrement: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

const iconButton =
  'inline-flex size-9 items-center justify-center rounded-lg border border-rule text-ink transition-colors hover:bg-paper disabled:opacity-40 disabled:hover:bg-transparent';

export function BasketLineItem({
  product,
  quantity,
  pricedLine,
  canIncrement,
  onIncrement,
  onDecrement,
  onRemove,
}: BasketLineItemProps) {
  return (
    // Two lines per item: the basket panel is at most 400px wide, too narrow to fit the
    // name, unit price, quantity controls, line price and remove button side by side.
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5">
          <WidgetSwatch code={product.code} size="sm" />
        </span>
        <p className="min-w-0 flex-1 font-semibold break-words">{product.name}</p>
        <p className="shrink-0 text-right font-mono font-medium tabular-nums">
          {pricedLine ? formatCents(pricedLine.lineSubtotalCents) : <span className="text-muted">…</span>}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pl-8">
        <p className="text-muted min-w-24 font-mono text-sm">{formatCents(product.priceCents)} each</p>

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
            <span className="w-7 text-center font-mono font-medium tabular-nums" aria-label={`Quantity ${quantity}`}>
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={!canIncrement}
              aria-label={`Add one ${product.name}`}
              className={iconButton}
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove all ${product.name} from basket`}
            className={`${iconButton} text-muted border-transparent hover:text-red-700`}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}
