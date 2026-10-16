import type { ProductCode } from '../types/api';

export interface BasketEntry {
  code: ProductCode;
  quantity: number;
}

export function countUnits(entries: readonly BasketEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.quantity, 0);
}

/** Adds one unit, unless the basket already holds `maxItems` units. */
export function addUnit(entries: BasketEntry[], code: ProductCode, maxItems?: number): BasketEntry[] {
  if (maxItems !== undefined && countUnits(entries) >= maxItems) {
    return entries;
  }

  return entries.some((entry) => entry.code === code)
    ? entries.map((entry) => (entry.code === code ? { ...entry, quantity: entry.quantity + 1 } : entry))
    : [...entries, { code, quantity: 1 }];
}

/** Removes one unit; a line whose quantity reaches zero disappears. */
export function removeUnit(entries: BasketEntry[], code: ProductCode): BasketEntry[] {
  return entries
    .map((entry) => (entry.code === code ? { ...entry, quantity: entry.quantity - 1 } : entry))
    .filter((entry) => entry.quantity > 0);
}

export function removeLine(entries: BasketEntry[], code: ProductCode): BasketEntry[] {
  return entries.filter((entry) => entry.code !== code);
}

/** One product code per unit, in first-added order: the shape the quote API expects. */
export function toItemCodes(entries: readonly BasketEntry[]): ProductCode[] {
  return entries.flatMap((entry) => Array<ProductCode>(entry.quantity).fill(entry.code));
}
