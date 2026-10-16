<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

use InvalidArgumentException;

/**
 * Selects the delivery charge for a subtotal from ordered spend tiers.
 *
 * The tier with the highest threshold that the subtotal reaches wins, so a
 * threshold is inclusive: exactly $50.00 falls into the "$50 or more" tier.
 */
final readonly class DeliveryRules
{
    /** @var list<DeliveryTier> Tiers sorted by threshold, highest first. */
    private array $tiers;

    public function __construct(DeliveryTier ...$tiers)
    {
        $thresholds = array_map(static fn(DeliveryTier $tier): int => $tier->minSubtotalCents, $tiers);

        if (!in_array(0, $thresholds, true)) {
            throw new InvalidArgumentException('Delivery rules need a tier starting at 0 cents.');
        }

        if (count($thresholds) !== count(array_unique($thresholds))) {
            throw new InvalidArgumentException('Delivery tiers must have distinct thresholds.');
        }

        usort($tiers, static fn(DeliveryTier $a, DeliveryTier $b): int => $b->minSubtotalCents <=> $a->minSubtotalCents);

        $this->tiers = $tiers;
    }

    public function chargeFor(int $subtotalCents): int
    {
        if ($subtotalCents < 0) {
            throw new InvalidArgumentException('Subtotal must not be negative.');
        }

        foreach ($this->tiers as $tier) {
            if ($subtotalCents >= $tier->minSubtotalCents) {
                return $tier->chargeCents;
            }
        }

        // Unreachable: the constructor guarantees a tier at 0 cents.
        throw new \LogicException('No delivery tier matched.');
    }
}
