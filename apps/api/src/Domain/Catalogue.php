<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use InvalidArgumentException;

/**
 * Product lookup by code. Injected into the basket so products are configuration, not code.
 */
final readonly class Catalogue
{
    /** @var array<string, Product> */
    private array $products;

    public function __construct(Product ...$products)
    {
        $byCode = [];

        foreach ($products as $product) {
            if (isset($byCode[$product->code])) {
                throw new InvalidArgumentException(sprintf('Duplicate product code: %s', $product->code));
            }

            $byCode[$product->code] = $product;
        }

        $this->products = $byCode;
    }

    /**
     * @throws UnknownProductException
     */
    public function get(string $code): Product
    {
        return $this->products[$code] ?? throw new UnknownProductException($code);
    }

    public function has(string $code): bool
    {
        return isset($this->products[$code]);
    }

    /**
     * @return list<Product> Products in the order they were configured.
     */
    public function all(): array
    {
        return array_values($this->products);
    }
}
