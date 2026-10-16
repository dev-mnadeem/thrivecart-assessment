<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

/**
 * A promotion that reduces the merchandise subtotal.
 *
 * Offers are independent of each other and of the basket, so new offers can
 * be added by passing another implementation to the Basket constructor.
 */
interface OfferInterface
{
    /** Short customer-facing label, e.g. "Red Widget: buy one, get one half price". */
    public function label(): string;

    /**
     * @param list<Product> $items One entry per unit in the basket.
     *
     * @return int Discount in cents; 0 when the offer does not apply.
     */
    public function discountCents(array $items): int;
}
