import type { ProductCode } from '../types/api';

/**
 * Purely decorative colour swatches for the known widgets. Prices and names always
 * come from the API; unknown products fall back to a neutral swatch.
 */
const swatches: Record<string, string> = {
  R01: 'bg-red-500',
  G01: 'bg-emerald-500',
  B01: 'bg-sky-500',
};

export function swatchClass(code: ProductCode): string {
  return swatches[code] ?? 'bg-slate-400';
}
