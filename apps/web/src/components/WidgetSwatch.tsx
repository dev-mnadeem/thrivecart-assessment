import { swatchClass } from '../lib/widgetStyle';
import type { ProductCode } from '../types/api';

interface WidgetSwatchProps {
  code: ProductCode;
  size: 'sm' | 'lg';
}

/** A decorative washer-shaped colour chip for a widget. */
export function WidgetSwatch({ code, size }: WidgetSwatchProps) {
  const dimensions = size === 'lg' ? 'size-12 rounded-xl after:size-4' : 'size-5 rounded-md after:size-1.5';

  return (
    <span
      aria-hidden="true"
      className={`after:bg-card relative inline-flex shrink-0 items-center justify-center ring-1 ring-black/10 ring-inset after:rounded-full after:ring-1 after:ring-black/15 ${dimensions} ${swatchClass(code)}`}
    />
  );
}
