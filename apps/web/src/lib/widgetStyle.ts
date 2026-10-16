import type { ProductCode } from '../types/api';

/**
 * Purely decorative colour swatches for the known widgets. Prices and names always
 * come from the API; unknown products fall back to a neutral swatch.
 */
const swatches: Record<string, string> = {
  R01: 'bg-red-700',
  G01: 'bg-green-700',
  B01: 'bg-blue-700',
};

export function swatchClass(code: ProductCode): string {
  return swatches[code] ?? 'bg-stone-400';
}
