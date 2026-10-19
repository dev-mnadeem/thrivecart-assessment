import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { products } from '../test/fixtures';
import { ProductList } from './ProductList';

const noop = () => undefined;

describe('ProductList', () => {
  it('announces loading', () => {
    render(<ProductList state={{ status: 'loading' }} onRetry={noop} quantityOf={() => 0} onAdd={noop} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading products…');
  });

  it('shows an error with a retry button', async () => {
    const onRetry = vi.fn();
    render(
      <ProductList
        state={{ status: 'error', message: 'Boom', retryable: true }}
        onRetry={onRetry}
        quantityOf={() => 0}
        onAdd={noop}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('handles an empty catalogue', () => {
    render(
      <ProductList
        state={{ status: 'ready', products: [], maxBasketItems: 100 }}
        onRetry={noop}
        quantityOf={() => 0}
        onAdd={noop}
      />,
    );

    expect(screen.getByText('No products are available right now.')).toBeInTheDocument();
  });

  it('shows basket quantities and adds by product code', async () => {
    const onAdd = vi.fn();
    render(
      <ProductList
        state={{ status: 'ready', products, maxBasketItems: 100 }}
        onRetry={noop}
        quantityOf={(code) => (code === 'G01' ? 3 : 0)}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText('3 in basket')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add Blue Widget to basket' }));
    expect(onAdd).toHaveBeenCalledWith('B01');
  });

  it('is keyboard operable', async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(
      <ProductList
        state={{ status: 'ready', products, maxBasketItems: 100 }}
        onRetry={noop}
        quantityOf={() => 0}
        onAdd={onAdd}
      />,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Add Red Widget to basket' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAdd).toHaveBeenCalledWith('R01');
  });

  it('does not offer a retry for errors that cannot succeed', () => {
    render(
      <ProductList
        state={{ status: 'error', message: 'Not found', retryable: false }}
        onRetry={noop}
        quantityOf={() => 0}
        onAdd={noop}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Not found');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('disables adding when the basket is full', () => {
    render(
      <ProductList
        state={{ status: 'ready', products, maxBasketItems: 100 }}
        onRetry={noop}
        quantityOf={() => 0}
        onAdd={noop}
        canAdd={false}
      />,
    );

    for (const button of screen.getAllByRole('button', { name: /^Add .* to basket$/ })) {
      expect(button).toBeDisabled();
    }
  });
});
