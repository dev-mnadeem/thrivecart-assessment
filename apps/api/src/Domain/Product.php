<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use InvalidArgumentException;

/**
 * A sellable product. Prices are integer cents to keep arithmetic exact.
 */
final readonly class Product
{
    public function __construct(
        public string $code,
        public string $name,
        public int $priceCents,
    ) {
        if (trim($code) === '') {
            throw new InvalidArgumentException('Product code must not be empty.');
        }

        if (trim($name) === '') {
            throw new InvalidArgumentException(sprintf('Product %s must have a name.', $code));
        }

        if ($priceCents < 0) {
            throw new InvalidArgumentException(sprintf('Product %s must not have a negative price.', $code));
        }
    }
}
