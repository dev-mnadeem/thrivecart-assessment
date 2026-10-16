import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { quotes } from './test/fixtures';
import { json, mockApi } from './test/mockApi';

describe('App', () => {
  it('lists products with prices from the API', async () => {
    mockApi();
    render(<App />);

    expect(screen.getByText('Loading products…')).toBeInTheDocument();
    expect(await screen.findByText(/Red Widget \(R01\) — \$32\.95/)).toBeInTheDocument();
    expect(screen.getByText(/Blue Widget \(B01\) — \$7\.95/)).toBeInTheDocument();
  });

  it('shows the server-calculated total after adding products', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Add Red Widget to basket' }));
    expect(await screen.findByTestId('basket-total')).toHaveTextContent('$37.90');

    await user.click(screen.getByRole('button', { name: 'Add Red Widget to basket' }));
    await waitFor(() => expect(screen.getByTestId('basket-total')).toHaveTextContent('$54.37'));

    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/basket/quote',
      expect.objectContaining({ body: JSON.stringify({ items: ['R01', 'R01'] }) }),
    );
  });

  it('offers a retry when products fail to load', async () => {
    let failing = true;
    mockApi({
      productsResponse: () =>
        failing ? Promise.resolve(json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } }, 500)) : undefined,
    });
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/Green Widget \(G01\)/)).toBeInTheDocument();
  });

  it('ignores a stale quote that resolves after a newer one', async () => {
    let releaseFirst: (response: Response) => void = () => undefined;
    const firstQuote = new Promise<Response>((resolve) => {
      releaseFirst = resolve;
    });

    mockApi({ quoteResponse: (items) => (items.length === 1 ? firstQuote : undefined) });
    const user = userEvent.setup();
    render(<App />);

    const addRed = await screen.findByRole('button', { name: 'Add Red Widget to basket' });
    await user.click(addRed);
    await user.click(addRed);

    await waitFor(() => expect(screen.getByTestId('basket-total')).toHaveTextContent('$54.37'));

    // The first (one red) request now resolves late; it must not replace the newer total.
    releaseFirst(json(quotes.R01));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.getByTestId('basket-total')).toHaveTextContent('$54.37');
  });
});
