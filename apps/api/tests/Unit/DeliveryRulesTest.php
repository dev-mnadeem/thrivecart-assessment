<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Domain\DeliveryRules;
use Acme\Basket\Domain\DeliveryTier;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class DeliveryRulesTest extends TestCase
{
    private DeliveryRules $rules;

    protected function setUp(): void
    {
        $this->rules = new DeliveryRules(
            new DeliveryTier(0, 495),
            new DeliveryTier(5000, 295),
            new DeliveryTier(9000, 0),
        );
    }

    /**
     * @return iterable<string, array{int, int}>
     */
    public static function subtotals(): iterable
    {
        yield 'zero' => [0, 495];
        yield 'one cent' => [1, 495];
        yield 'just below $50' => [4999, 495];
        yield 'exactly $50' => [5000, 295];
        yield 'just above $50' => [5001, 295];
        yield 'just below $90' => [8999, 295];
        yield 'exactly $90' => [9000, 0];
        yield 'well above $90' => [100000, 0];
    }

    #[DataProvider('subtotals')]
    public function testSelectsChargeForSubtotal(int $subtotalCents, int $expectedChargeCents): void
    {
        self::assertSame($expectedChargeCents, $this->rules->chargeFor($subtotalCents));
    }

    public function testTierOrderDoesNotMatter(): void
    {
        $shuffled = new DeliveryRules(
            new DeliveryTier(9000, 0),
            new DeliveryTier(0, 495),
            new DeliveryTier(5000, 295),
        );

        self::assertSame(495, $shuffled->chargeFor(4999));
        self::assertSame(295, $shuffled->chargeFor(5000));
        self::assertSame(0, $shuffled->chargeFor(9000));
    }

    public function testRequiresATierStartingAtZero(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new DeliveryRules(new DeliveryTier(5000, 295));
    }

    public function testRejectsDuplicateThresholds(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new DeliveryRules(new DeliveryTier(0, 495), new DeliveryTier(0, 295));
    }

    public function testRejectsNegativeTierValues(): void
    {
        $this->expectException(InvalidArgumentException::class);

        new DeliveryTier(0, -1);
    }

    public function testRejectsNegativeSubtotal(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->rules->chargeFor(-1);
    }
}
