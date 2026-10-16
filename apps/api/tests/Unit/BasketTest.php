<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Config\DefaultPricing;
use Acme\Basket\Domain\Basket;
use Acme\Basket\Domain\Catalogue;
use Acme\Basket\Domain\OfferInterface;
use Acme\Basket\Domain\Product;
use Acme\Basket\Domain\UnknownProductException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class BasketTest extends TestCase
{
    /**
     * The four examples from the assessment brief. These values are fixed.
     *
     * @return iterable<string, array{list<string>, int}>
     */
    public static function assessmentExamples(): iterable
    {
        yield 'B01, G01 = $37.85' => [['B01', 'G01'], 3785];
        yield 'R01, R01 = $54.37' => [['R01', 'R01'], 5437];
        yield 'R01, G01 = $60.85' => [['R01', 'G01'], 6085];
        yield 'B01, B01, R01, R01, R01 = $98.27' => [['B01', 'B01', 'R01', 'R01', 'R01'], 9827];
    }

    /**
     * @param list<string> $codes
     */
    #[DataProvider('assessmentExamples')]
    public function testMatchesAssessmentExamples(array $codes, int $expectedTotalCents): void
    {
        self::assertSame($expectedTotalCents, self::basketWith($codes)->total());
    }

    /**
     * @return iterable<string, array{list<string>, int}>
     */
    public static function edgeCases(): iterable
    {
        yield 'single red' => [['R01'], 3295 + 495];
        yield 'single green' => [['G01'], 2495 + 495];
        yield 'single blue' => [['B01'], 795 + 495];
        yield 'three reds: one pair, $50+ delivery' => [['R01', 'R01', 'R01'], 9885 - 1648 + 295];
        yield 'four reds: two pairs, free delivery' => [['R01', 'R01', 'R01', 'R01'], 13180 - 3296];
        yield 'one of each' => [['R01', 'G01', 'B01'], 6585 + 295];
    }

    /**
     * @param list<string> $codes
     */
    #[DataProvider('edgeCases')]
    public function testPricesEdgeCases(array $codes, int $expectedTotalCents): void
    {
        self::assertSame($expectedTotalCents, self::basketWith($codes)->total());
    }

    public function testEmptyBasketCostsNothingAndHasNoDelivery(): void
    {
        $totals = DefaultPricing::newBasket()->breakdown();

        self::assertSame(0, $totals->subtotalCents);
        self::assertSame(0, $totals->deliveryCents);
        self::assertSame(0, $totals->totalCents());
        self::assertSame([], $totals->lines);
    }

    public function testDeliveryUsesDiscountedSubtotal(): void
    {
        // Two reds: 6590 before the offer would earn $2.95 delivery,
        // but 4942 after the offer is under $50, so delivery is $4.95.
        $totals = self::basketWith(['R01', 'R01'])->breakdown();

        self::assertSame(6590, $totals->subtotalCents);
        self::assertSame(1648, $totals->discountCents);
        self::assertSame(4942, $totals->discountedSubtotalCents());
        self::assertSame(495, $totals->deliveryCents);
        self::assertSame(5437, $totals->totalCents());
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function deliveryBoundaries(): iterable
    {
        yield 'just below $50' => [4999, 495];
        yield 'exactly $50' => [5000, 295];
        yield 'just below $90' => [8999, 295];
        yield 'exactly $90' => [9000, 0];
    }

    #[DataProvider('deliveryBoundaries')]
    public function testDeliveryBoundaries(int $priceCents, int $expectedDeliveryCents): void
    {
        $basket = new Basket(
            new Catalogue(new Product('T01', 'Test Widget', $priceCents)),
            DefaultPricing::deliveryRules(),
            DefaultPricing::offers(),
        );
        $basket->add('T01');

        self::assertSame($expectedDeliveryCents, $basket->breakdown()->deliveryCents);
        self::assertSame($priceCents + $expectedDeliveryCents, $basket->total());
    }

    public function testRejectsUnknownProductsWithoutChangingTheBasket(): void
    {
        $basket = self::basketWith(['B01']);

        try {
            $basket->add('X99');
            self::fail('Expected an UnknownProductException.');
        } catch (UnknownProductException $exception) {
            self::assertSame('X99', $exception->productCode);
        }

        self::assertSame(795 + 495, $basket->total());
    }

    public function testTotalIsRepeatableAndDoesNotMutateTheBasket(): void
    {
        $basket = self::basketWith(['R01', 'R01']);

        self::assertSame($basket->total(), $basket->total());
        self::assertSame(5437, $basket->total());

        $basket->add('B01');

        self::assertSame(6590 - 1648 + 795 + 295, $basket->total());
    }

    public function testTotalMatchesBreakdown(): void
    {
        $basket = self::basketWith(['B01', 'B01', 'R01', 'R01', 'R01']);

        self::assertSame($basket->breakdown()->totalCents(), $basket->total());
    }

    public function testOrderOfAdditionDoesNotAffectTotal(): void
    {
        self::assertSame(
            self::basketWith(['B01', 'B01', 'R01', 'R01', 'R01'])->total(),
            self::basketWith(['R01', 'B01', 'R01', 'B01', 'R01'])->total(),
        );
    }

    public function testGroupsItemsIntoLinesInFirstAddedOrder(): void
    {
        $lines = self::basketWith(['B01', 'R01', 'B01', 'R01', 'R01'])->breakdown()->lines;

        self::assertCount(2, $lines);
        self::assertSame('B01', $lines[0]->product->code);
        self::assertSame(2, $lines[0]->quantity);
        self::assertSame(1590, $lines[0]->subtotalCents());
        self::assertSame('R01', $lines[1]->product->code);
        self::assertSame(3, $lines[1]->quantity);
        self::assertSame(9885, $lines[1]->subtotalCents());
    }

    public function testReportsAppliedOffers(): void
    {
        self::assertSame([], self::basketWith(['R01'])->breakdown()->appliedOffers);

        $applied = self::basketWith(['R01', 'R01'])->breakdown()->appliedOffers;

        self::assertCount(1, $applied);
        self::assertSame(1648, $applied[0]->discountCents);
    }

    public function testAcceptsAdditionalOffersWithoutChangingTheBasket(): void
    {
        $greenOneOff = new class implements OfferInterface {
            public function label(): string
            {
                return '$1 off each green widget';
            }

            public function discountCents(array $items): int
            {
                return 100 * count(array_filter($items, static fn(Product $p): bool => $p->code === 'G01'));
            }
        };

        $basket = new Basket(
            DefaultPricing::catalogue(),
            DefaultPricing::deliveryRules(),
            [...DefaultPricing::offers(), $greenOneOff],
        );

        foreach (['R01', 'R01', 'G01'] as $code) {
            $basket->add($code);
        }

        $totals = $basket->breakdown();

        self::assertSame(1648 + 100, $totals->discountCents);
        self::assertCount(2, $totals->appliedOffers);
        // 9085 - 1748 = 7337 discounted subtotal -> $2.95 delivery.
        self::assertSame(7337 + 295, $totals->totalCents());
    }

    public function testDiscountNeverExceedsSubtotal(): void
    {
        $generous = new class implements OfferInterface {
            public function label(): string
            {
                return 'Too generous';
            }

            public function discountCents(array $items): int
            {
                return 1_000_000;
            }
        };

        $basket = new Basket(DefaultPricing::catalogue(), DefaultPricing::deliveryRules(), [$generous]);
        $basket->add('B01');

        $totals = $basket->breakdown();

        self::assertSame(795, $totals->discountCents);
        self::assertSame(0, $totals->discountedSubtotalCents());
        self::assertSame(495, $totals->totalCents());
    }

    /**
     * @param list<string> $codes
     */
    private static function basketWith(array $codes): Basket
    {
        $basket = DefaultPricing::newBasket();

        foreach ($codes as $code) {
            $basket->add($code);
        }

        return $basket;
    }
}
