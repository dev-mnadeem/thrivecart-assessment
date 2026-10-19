<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Config\DefaultPricing;
use Acme\Basket\Domain\BuyOneGetOneHalfPriceOffer;
use Acme\Basket\Domain\Catalogue;
use Acme\Basket\Domain\Product;
use Acme\Basket\Domain\UnknownProductException;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class BuyOneGetOneHalfPriceOfferTest extends TestCase
{
    private Product $red;
    private Product $green;
    private Product $blue;

    protected function setUp(): void
    {
        $this->red = new Product('R01', 'Red Widget', 3295);
        $this->green = new Product('G01', 'Green Widget', 2495);
        $this->blue = new Product('B01', 'Blue Widget', 795);
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function redQuantities(): iterable
    {
        yield 'no reds' => [0, 0];
        yield 'one red' => [1, 0];
        yield 'two reds: one half-price' => [2, 1648];
        yield 'three reds: still one pair' => [3, 1648];
        yield 'four reds: two pairs' => [4, 3296];
        yield 'five reds: two pairs' => [5, 3296];
    }

    #[DataProvider('redQuantities')]
    public function testDiscountsOneUnitPerCompletePair(int $reds, int $expectedDiscountCents): void
    {
        $items = array_fill(0, $reds, $this->red);

        self::assertSame($expectedDiscountCents, (new BuyOneGetOneHalfPriceOffer($this->red))->discountCents($items));
    }

    public function testRoundsHalfCentDiscountUp(): void
    {
        // 3295 / 2 = 1647.5 cents: the discount is 1648, so the second widget costs 1647.
        $discount = (new BuyOneGetOneHalfPriceOffer($this->red))->discountCents([$this->red, $this->red]);

        self::assertSame(1648, $discount);
        self::assertSame(1647, $this->red->priceCents - $discount);
    }

    public function testEvenPricesHalveExactly(): void
    {
        $evenRed = new Product('R01', 'Red Widget', 3000);

        self::assertSame(1500, (new BuyOneGetOneHalfPriceOffer($evenRed))->discountCents([$evenRed, $evenRed]));
    }

    public function testIgnoresOtherProducts(): void
    {
        $items = [$this->green, $this->green, $this->blue, $this->blue];

        self::assertSame(0, (new BuyOneGetOneHalfPriceOffer($this->red))->discountCents($items));
    }

    public function testPairsRegardlessOfPosition(): void
    {
        $items = [$this->red, $this->blue, $this->green, $this->red];

        self::assertSame(1648, (new BuyOneGetOneHalfPriceOffer($this->red))->discountCents($items));
    }

    public function testAppliesToAnyProduct(): void
    {
        // 2495 / 2 = 1247.5 cents, rounded up to 1248.
        $offer = new BuyOneGetOneHalfPriceOffer($this->green);

        self::assertSame(1248, $offer->discountCents([$this->green, $this->red, $this->green, $this->red]));
    }

    public function testUsesTheOfferProductsPrice(): void
    {
        $repriced = new Product('R01', 'Red Widget', 1000);

        self::assertSame(1648, (new BuyOneGetOneHalfPriceOffer($this->red))->discountCents([$repriced, $repriced]));
    }

    public function testLabelDefaultsToProductName(): void
    {
        self::assertSame(
            'Green Widget: buy one, get the second half price',
            (new BuyOneGetOneHalfPriceOffer($this->green))->label(),
        );
    }

    public function testLabelCanBeOverridden(): void
    {
        self::assertSame('Red pairs: 50% off', (new BuyOneGetOneHalfPriceOffer($this->red, 'Red pairs: 50% off'))->label());
    }

    public function testRejectsBlankLabel(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new BuyOneGetOneHalfPriceOffer($this->red, ' ');
    }

    public function testDefaultOffersFailFastWhenTheirProductIsMissing(): void
    {
        $this->expectException(UnknownProductException::class);

        DefaultPricing::offers(new Catalogue($this->green, $this->blue));
    }
}
