<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Domain\Product;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class ProductTest extends TestCase
{
    public function testExposesCodeNameAndPriceInCents(): void
    {
        $product = new Product('R01', 'Red Widget', 3295);

        self::assertSame('R01', $product->code);
        self::assertSame('Red Widget', $product->name);
        self::assertSame(3295, $product->priceCents);
    }

    public function testAllowsFreeProducts(): void
    {
        self::assertSame(0, (new Product('F01', 'Free Sample', 0))->priceCents);
    }

    /**
     * @return iterable<string, array{string, string, int}>
     */
    public static function invalidProducts(): iterable
    {
        yield 'empty code' => ['', 'Red Widget', 3295];
        yield 'blank code' => ['  ', 'Red Widget', 3295];
        yield 'empty name' => ['R01', '', 3295];
        yield 'negative price' => ['R01', 'Red Widget', -1];
    }

    #[DataProvider('invalidProducts')]
    public function testRejectsInvalidDefinitions(string $code, string $name, int $priceCents): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Product($code, $name, $priceCents);
    }
}
