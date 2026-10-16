<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

final readonly class BasketLine
{
    public function __construct(
        public Product $product,
        public int $quantity,
    ) {
    }

    public function subtotalCents(): int
    {
        return $this->product->priceCents * $this->quantity;
    }
}
