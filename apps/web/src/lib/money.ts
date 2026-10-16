const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** Formats integer cents for display. This is the only money "arithmetic" the frontend does. */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}
