<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

/**
 * "Buy one red widget, get the second half price."
 *
 * Every complete pair of the product earns one half-price unit. Half of an odd
 * cent amount is rounded up in the customer's favour (3295 / 2 = 1647.5 -> 1648),
 * which is what the assessment's expected totals require.
 */
final readonly class RedWidgetHalfPriceOffer implements OfferInterface
{
    private const string PRODUCT_CODE = 'R01';

    public function label(): string
    {
        return 'Red Widget: buy one, get the second half price';
    }

    public function discountCents(array $items): int
    {
        $matching = array_values(array_filter(
            $items,
            static fn(Product $product): bool => $product->code === self::PRODUCT_CODE,
        ));

        if ($matching === []) {
            return 0;
        }

        $pairs = intdiv(count($matching), 2);

        return $pairs * self::halfRoundedUp($matching[0]->priceCents);
    }

    private static function halfRoundedUp(int $cents): int
    {
        return intdiv($cents + 1, 2);
    }
}
