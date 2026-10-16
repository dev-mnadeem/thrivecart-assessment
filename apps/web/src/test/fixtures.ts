import type { Product, Quote } from '../types/api';

export const products: Product[] = [
  { code: 'R01', name: 'Red Widget', priceCents: 3295 },
  { code: 'G01', name: 'Green Widget', priceCents: 2495 },
  { code: 'B01', name: 'Blue Widget', priceCents: 795 },
];

/** Quotes as the PHP API returns them, keyed by comma-joined product codes. */
export const quotes: Record<string, Quote> = {
  R01: {
    items: [{ code: 'R01', name: 'Red Widget', unitPriceCents: 3295, quantity: 1, lineSubtotalCents: 3295 }],
    appliedOffers: [],
    subtotalCents: 3295,
    discountCents: 0,
    discountedSubtotalCents: 3295,
    deliveryCents: 495,
    totalCents: 3790,
  },
  'R01,R01': {
    items: [{ code: 'R01', name: 'Red Widget', unitPriceCents: 3295, quantity: 2, lineSubtotalCents: 6590 }],
    appliedOffers: [{ label: 'Red Widget: buy one, get the second half price', discountCents: 1648 }],
    subtotalCents: 6590,
    discountCents: 1648,
    discountedSubtotalCents: 4942,
    deliveryCents: 495,
    totalCents: 5437,
  },
  B01: {
    items: [{ code: 'B01', name: 'Blue Widget', unitPriceCents: 795, quantity: 1, lineSubtotalCents: 795 }],
    appliedOffers: [],
    subtotalCents: 795,
    discountCents: 0,
    discountedSubtotalCents: 795,
    deliveryCents: 495,
    totalCents: 1290,
  },
  'B01,G01': {
    items: [
      { code: 'B01', name: 'Blue Widget', unitPriceCents: 795, quantity: 1, lineSubtotalCents: 795 },
      { code: 'G01', name: 'Green Widget', unitPriceCents: 2495, quantity: 1, lineSubtotalCents: 2495 },
    ],
    appliedOffers: [],
    subtotalCents: 3290,
    discountCents: 0,
    discountedSubtotalCents: 3290,
    deliveryCents: 495,
    totalCents: 3785,
  },
};
