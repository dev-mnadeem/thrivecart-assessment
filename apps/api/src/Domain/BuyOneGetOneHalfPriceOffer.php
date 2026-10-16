<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use InvalidArgumentException;

/**
 * "Buy one, get the second half price" for a single product.
 *
 * Every complete pair of the product earns one half-price unit. Half of an odd
 * cent amount is rounded up in the customer's favour (3295 / 2 = 1647.5 -> 1648),
 * which is what the assessment's expected totals require.
 *
 * The offer takes a Product rather than a code, so it is built from the catalogue
 * (`$catalogue->get('R01')`) and an offer for a missing product fails at start-up.
 */
final readonly class BuyOneGetOneHalfPriceOffer implements OfferInterface
{
    private string $label;

    public function __construct(
        private Product $product,
        ?string $label = null,
    ) {
        $label ??= sprintf('%s: buy one, get the second half price', $product->name);

        if (trim($label) === '') {
            throw new InvalidArgumentException('Offer label must not be empty.');
        }

        $this->label = $label;
    }

    public function label(): string
    {
        return $this->label;
    }

    public function discountCents(array $items): int
    {
        $count = 0;

        foreach ($items as $item) {
            if ($item->code === $this->product->code) {
                $count++;
            }
        }

        return intdiv($count, 2) * self::halfRoundedUp($this->product->priceCents);
    }

    private static function halfRoundedUp(int $cents): int
    {
        return intdiv($cents + 1, 2);
    }
}
