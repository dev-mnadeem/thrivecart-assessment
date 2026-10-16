import { describe, expect, it } from 'vitest';
import { addUnit, countUnits, removeLine, removeUnit, toItemCodes, type BasketEntry } from './basketEntries';

const basket: BasketEntry[] = [
  { code: 'B01', quantity: 2 },
  { code: 'R01', quantity: 1 },
];

describe('basket entries', () => {
  it('counts units across lines', () => {
    expect(countUnits(basket)).toBe(3);
    expect(countUnits([])).toBe(0);
  });

  it('adds a new line at the end and increments an existing one in place', () => {
    expect(addUnit(basket, 'G01')).toEqual([...basket, { code: 'G01', quantity: 1 }]);
    expect(addUnit(basket, 'B01')).toEqual([
      { code: 'B01', quantity: 3 },
      { code: 'R01', quantity: 1 },
    ]);
  });

  it('refuses to add past the limit and returns the same array', () => {
    expect(addUnit(basket, 'G01', 3)).toBe(basket);
    expect(addUnit(basket, 'G01', 4)).toHaveLength(3);
  });

  it('drops a line when its last unit is removed', () => {
    expect(removeUnit(basket, 'R01')).toEqual([{ code: 'B01', quantity: 2 }]);
    expect(removeUnit(basket, 'B01')).toEqual([
      { code: 'B01', quantity: 1 },
      { code: 'R01', quantity: 1 },
    ]);
  });

  it('removes a whole line', () => {
    expect(removeLine(basket, 'B01')).toEqual([{ code: 'R01', quantity: 1 }]);
  });

  it('expands lines to one code per unit', () => {
    expect(toItemCodes(basket)).toEqual(['B01', 'B01', 'R01']);
  });
});
