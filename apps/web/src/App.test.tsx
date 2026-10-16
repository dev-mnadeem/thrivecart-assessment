import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { quotes } from './test/fixtures';
import { json, mockApi } from './test/mockApi';

async function renderApp() {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('button', { name: 'Add Red Widget to basket' });

  return user;
}

function basket() {
  return within(screen.getByRole('region', { name: /basket/i }));
}

describe('App', () => {
  it('lists products with prices from the API', async () => {
    mockApi();
    render(<App />);

    expect(screen.getByText('Loading products…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Red Widget' })).toBeInTheDocument();
    expect(screen.getByText('$32.95')).toBeInTheDocument();
    expect(screen.getByText('$24.95')).toBeInTheDocument();
    expect(screen.getByText('$7.95')).toBeInTheDocument();
  });

  it('starts with an empty basket', async () => {
    mockApi();
    await renderApp();

    expect(basket().getByText(/your basket is empty/i)).toBeInTheDocument();
    expect(basket().queryByTestId('basket-total')).not.toBeInTheDocument();
  });

  it.each([
    [['B01', 'G01'], '$37.85'],
    [['R01', 'R01'], '$54.37'],
    [['R01', 'G01'], '$60.85'],
    [['B01', 'B01', 'R01', 'R01', 'R01'], '$98.27'],
  ])('prices the assessment basket %j at %s', async (codes, expectedTotal) => {
    const names: Record<string, string> = { R01: 'Red Widget', G01: 'Green Widget', B01: 'Blue Widget' };
    mockApi();
    const user = await renderApp();

    for (const code of codes) {
      await user.click(screen.getByRole('button', { name: `Add ${names[code]} to basket` }));
    }

    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent(expectedTotal));
  });

  it('shows the red widget saving and discounted delivery', async () => {
    mockApi();
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Red Widget to basket' }));
    await user.click(screen.getByRole('button', { name: 'Add Red Widget to basket' }));

    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent('$54.37'));
    expect(basket().getByTestId('subtotal')).toHaveTextContent('$65.90');
    expect(basket().getByText('Red Widget: buy one, get the second half price')).toBeInTheDocument();
    expect(basket().getByText('−$16.48')).toBeInTheDocument();
    expect(basket().getByTestId('delivery')).toHaveTextContent('$4.95');
  });

  it('shows free delivery when the API charges none', async () => {
    mockApi();
    const user = await renderApp();

    for (const name of ['Blue Widget', 'Blue Widget', 'Red Widget', 'Red Widget', 'Red Widget']) {
      await user.click(screen.getByRole('button', { name: `Add ${name} to basket` }));
    }

    await waitFor(() => expect(basket().getByTestId('delivery')).toHaveTextContent('Free'));
  });

  it('increments, decrements and removes basket lines', async () => {
    mockApi();
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Red Widget to basket' }));
    await user.click(await basket().findByRole('button', { name: 'Add one Red Widget' }));

    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent('$54.37'));
    expect(screen.getByText('2 in basket')).toBeInTheDocument();

    await user.click(basket().getByRole('button', { name: 'Remove one Red Widget' }));
    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent('$37.90'));

    await user.click(basket().getByRole('button', { name: 'Remove all Red Widget from basket' }));
    expect(basket().getByText(/your basket is empty/i)).toBeInTheDocument();
  });

  it('removes a line when its quantity is decremented to zero', async () => {
    mockApi();
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Blue Widget to basket' }));
    await user.click(await basket().findByRole('button', { name: 'Remove one Blue Widget' }));

    expect(basket().getByText(/your basket is empty/i)).toBeInTheDocument();
  });

  it('empties the basket', async () => {
    mockApi();
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Blue Widget to basket' }));
    await user.click(screen.getByRole('button', { name: 'Add Green Widget to basket' }));
    await user.click(basket().getByRole('button', { name: 'Empty basket' }));

    expect(basket().getByText(/your basket is empty/i)).toBeInTheDocument();
  });

  it('offers a retry when products fail to load', async () => {
    let failing = true;
    mockApi({
      productsResponse: () =>
        failing
          ? Promise.resolve(json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } }, 500))
          : undefined,
    });
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');

    failing = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Green Widget' })).toBeInTheDocument();
  });

  it('shows a pricing error with retry, keeping the basket', async () => {
    let failing = true;
    mockApi({
      quoteResponse: () =>
        failing
          ? Promise.resolve(json({ error: { code: 'NETWORK_ERROR', message: 'Could not reach the server.' } }, 503))
          : undefined,
    });
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Blue Widget to basket' }));

    expect(await basket().findByRole('alert')).toHaveTextContent('Could not reach the server.');
    expect(basket().getByText('Blue Widget')).toBeInTheDocument();

    failing = false;
    await user.click(basket().getByRole('button', { name: 'Retry pricing' }));

    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent('$12.90'));
    expect(basket().queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an updating indicator while a quote is in flight', async () => {
    mockApi({ quoteResponse: () => new Promise<Response>(() => undefined) });
    const user = await renderApp();

    await user.click(screen.getByRole('button', { name: 'Add Green Widget to basket' }));

    expect(basket().getByRole('status')).toHaveTextContent('Updating total…');
  });

  it('ignores a stale quote that resolves after a newer one', async () => {
    let releaseFirst: (response: Response) => void = () => undefined;
    const firstQuote = new Promise<Response>((resolve) => {
      releaseFirst = resolve;
    });

    mockApi({ quoteResponse: (items) => (items.length === 1 ? firstQuote : undefined) });
    const user = await renderApp();

    const addRed = screen.getByRole('button', { name: 'Add Red Widget to basket' });
    await user.click(addRed);
    await user.click(addRed);

    await waitFor(() => expect(basket().getByTestId('basket-total')).toHaveTextContent('$54.37'));

    // The first (one red) request now resolves late; it must not replace the newer total.
    releaseFirst(json(quotes.R01));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(basket().getByTestId('basket-total')).toHaveTextContent('$54.37');
  });
});
