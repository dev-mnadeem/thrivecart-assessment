/** API data transfer objects. All money values are integer cents calculated by the PHP API. */

/** A product code from the catalogue, e.g. "R01". The catalogue itself lives on the server. */
export type ProductCode = string;

export interface Product {
  code: ProductCode;
  name: string;
  priceCents: number;
}

export interface ProductsResponse {
  products: Product[];
  /** The most product units a quote may contain; the API rejects larger baskets. */
  maxBasketItems: number;
}

export interface QuoteLine {
  code: ProductCode;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineSubtotalCents: number;
}

export interface AppliedOffer {
  label: string;
  discountCents: number;
}

export interface Quote {
  items: QuoteLine[];
  appliedOffers: AppliedOffer[];
  subtotalCents: number;
  discountCents: number;
  discountedSubtotalCents: number;
  deliveryCents: number;
  totalCents: number;
}

export interface QuoteRequest {
  items: ProductCode[];
}

export interface ApiErrorBody {
  error: { code: string; message: string };
}
