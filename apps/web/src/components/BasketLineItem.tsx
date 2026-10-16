import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCents } from '../lib/money';
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
  'inline-flex size-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100';

export function BasketLineItem({ product, quantity, pricedLine, onIncrement, onDecrement, onRemove }: BasketLineItemProps) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{product.name}</p>
        <p className="text-sm text-slate-500">{formatCents(product.priceCents)} each</p>
      </div>

      <div className="flex items-center gap-2" role="group" aria-label={`${product.name} quantity`}>
        <button type="button" onClick={onDecrement} aria-label={`Remove one ${product.name}`} className={iconButton}>
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span className="w-6 text-center tabular-nums" aria-live="polite">
          {quantity}
        </span>
        <button type="button" onClick={onIncrement} aria-label={`Add one ${product.name}`} className={iconButton}>
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>

      <p className="w-20 text-right font-medium tabular-nums">
        {pricedLine ? formatCents(pricedLine.lineSubtotalCents) : '…'}
      </p>

      <button type="button" onClick={onRemove} aria-label={`Remove all ${product.name} from basket`} className={iconButton}>
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}
