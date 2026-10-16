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
      <ProductList state={{ status: 'error', message: 'Boom' }} onRetry={onRetry} quantityOf={() => 0} onAdd={noop} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('handles an empty catalogue', () => {
    render(<ProductList state={{ status: 'ready', products: [] }} onRetry={noop} quantityOf={() => 0} onAdd={noop} />);

    expect(screen.getByText('No products are available right now.')).toBeInTheDocument();
  });

  it('shows basket quantities and adds by product code', async () => {
    const onAdd = vi.fn();
    render(
      <ProductList
        state={{ status: 'ready', products }}
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
    render(<ProductList state={{ status: 'ready', products }} onRetry={noop} quantityOf={() => 0} onAdd={onAdd} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Add Red Widget to basket' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onAdd).toHaveBeenCalledWith('R01');
  });
});
