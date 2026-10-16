<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use InvalidArgumentException;

/**
 * Charge applied when the discounted subtotal is at least $minSubtotalCents.
 */
final readonly class DeliveryTier
{
    public function __construct(
        public int $minSubtotalCents,
        public int $chargeCents,
    ) {
        if ($minSubtotalCents < 0 || $chargeCents < 0) {
            throw new InvalidArgumentException('Delivery tier amounts must not be negative.');
        }
    }
}
