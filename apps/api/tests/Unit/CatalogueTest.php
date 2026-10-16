<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Domain\Catalogue;
use Acme\Basket\Domain\Product;
use Acme\Basket\Domain\UnknownProductException;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class CatalogueTest extends TestCase
{
    private Catalogue $catalogue;

    protected function setUp(): void
    {
        $this->catalogue = new Catalogue(
            new Product('R01', 'Red Widget', 3295),
            new Product('G01', 'Green Widget', 2495),
            new Product('B01', 'Blue Widget', 795),
        );
    }

    public function testLooksUpProductsByCode(): void
    {
        self::assertSame(3295, $this->catalogue->get('R01')->priceCents);
        self::assertSame(2495, $this->catalogue->get('G01')->priceCents);
        self::assertSame(795, $this->catalogue->get('B01')->priceCents);
    }

    public function testListsProductsInConfiguredOrder(): void
    {
        $codes = array_map(static fn (Product $product): string => $product->code, $this->catalogue->all());

        self::assertSame(['R01', 'G01', 'B01'], $codes);
    }

    public function testReportsWhetherACodeExists(): void
    {
        self::assertTrue($this->catalogue->has('B01'));
        self::assertFalse($this->catalogue->has('X99'));
    }

    public function testThrowsForUnknownCodes(): void
    {
        try {
            $this->catalogue->get('X99');
            self::fail('Expected an UnknownProductException.');
        } catch (UnknownProductException $exception) {
            self::assertSame('X99', $exception->productCode);
            self::assertSame('Unknown product code: X99', $exception->getMessage());
        }
    }

    public function testLookupIsCaseSensitive(): void
    {
        $this->expectException(UnknownProductException::class);

        $this->catalogue->get('r01');
    }

    public function testRejectsDuplicateCodes(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new Catalogue(new Product('R01', 'Red Widget', 3295), new Product('R01', 'Other', 100));
    }
}
