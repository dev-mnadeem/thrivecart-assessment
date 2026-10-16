<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

/**
 * Immutable price breakdown of a basket. All amounts are integer cents.
 */
final readonly class BasketTotals
{
    /**
     * @param list<BasketLine>   $lines         One line per product, in the order first added.
     * @param list<AppliedOffer> $appliedOffers Offers that produced a non-zero discount.
     */
    public function __construct(
        public array $lines,
        public array $appliedOffers,
        public int $subtotalCents,
        public int $discountCents,
        public int $deliveryCents,
    ) {}

    public function discountedSubtotalCents(): int
    {
        return $this->subtotalCents - $this->discountCents;
    }

    public function totalCents(): int
    {
        return $this->discountedSubtotalCents() + $this->deliveryCents;
    }
}
