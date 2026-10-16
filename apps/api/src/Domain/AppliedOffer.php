<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

final readonly class AppliedOffer
{
    public function __construct(
        public string $label,
        public int $discountCents,
    ) {
    }
}
