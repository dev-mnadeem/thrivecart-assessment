import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { quotes } from '../test/fixtures';
import type { Quote } from '../types/api';
import { PriceSummary } from './PriceSummary';

function fixture(key: string): Quote {
  const quote = quotes[key];

  if (!quote) {
    throw new Error(`Missing fixture ${key}`);
  }

  return quote;
}

describe('PriceSummary', () => {
  it('shows subtotal, delivery and total without offers', () => {
    render(<PriceSummary quote={fixture('B01,G01')} />);

    expect(screen.getByTestId('subtotal')).toHaveTextContent('$32.90');
    expect(screen.getByTestId('delivery')).toHaveTextContent('$4.95');
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$37.85');
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free delivery/i)).not.toBeInTheDocument();
  });

  it('lists applied offers and the total saving', () => {
    render(<PriceSummary quote={fixture('R01,R01')} />);

    expect(screen.getByText('Red Widget: buy one, get the second half price')).toBeInTheDocument();
    expect(screen.getByText('−$16.48')).toBeInTheDocument();
    expect(screen.getByText("You're saving $16.48 with offers.")).toBeInTheDocument();
  });

  it('highlights free delivery', () => {
    render(<PriceSummary quote={fixture('B01,B01,R01,R01,R01')} />);

    expect(screen.getByTestId('delivery')).toHaveTextContent('Free');
    expect(screen.getByText('Your order qualifies for free delivery.')).toBeInTheDocument();
    expect(screen.getByTestId('basket-total')).toHaveTextContent('$98.27');
  });
});
