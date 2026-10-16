<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use DomainException;

final class UnknownProductException extends DomainException
{
    public function __construct(public readonly string $productCode)
    {
        parent::__construct(sprintf('Unknown product code: %s', $productCode));
    }
}
