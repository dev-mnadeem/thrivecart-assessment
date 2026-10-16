<?php

declare(strict_types=1);

namespace Acme\Basket\Domain;

/**
 * A shopping basket priced from an injected catalogue, delivery rules and offers.
 *
 * Calculation order:
 *   1. subtotal  = sum of item prices
 *   2. discount  = sum of offer discounts (never more than the subtotal)
 *   3. delivery  = charge for (subtotal - discount); an empty basket has no delivery
 *   4. total     = subtotal - discount + delivery
 */
final class Basket
{
    /** @var list<Product> One entry per unit added. */
    private array $items = [];

    /** @var list<OfferInterface> */
    private readonly array $offers;

    /**
     * @param iterable<OfferInterface> $offers
     */
    public function __construct(
        private readonly Catalogue $catalogue,
        private readonly DeliveryRules $deliveryRules,
        iterable $offers = [],
    ) {
        $list = [];

        foreach ($offers as $offer) {
            $list[] = $offer;
        }

        $this->offers = $list;
    }

    /**
     * @throws UnknownProductException
     */
    public function add(string $productCode): void
    {
        $this->items[] = $this->catalogue->get($productCode);
    }

    /**
     * @return int Total cost in cents, including offers and delivery.
     */
    public function total(): int
    {
        return $this->breakdown()->totalCents();
    }

    public function breakdown(): BasketTotals
    {
        $subtotalCents = array_sum(array_map(static fn (Product $product): int => $product->priceCents, $this->items));

        $appliedOffers = [];
        $discountCents = 0;

        foreach ($this->offers as $offer) {
            $offerDiscount = $offer->discountCents($this->items);

            if ($offerDiscount > 0) {
                $appliedOffers[] = new AppliedOffer($offer->label(), $offerDiscount);
                $discountCents += $offerDiscount;
            }
        }

        $discountCents = min($discountCents, $subtotalCents);

        $deliveryCents = $this->items === []
            ? 0
            : $this->deliveryRules->chargeFor($subtotalCents - $discountCents);

        return new BasketTotals($this->lines(), $appliedOffers, $subtotalCents, $discountCents, $deliveryCents);
    }

    /**
     * @return list<BasketLine>
     */
    private function lines(): array
    {
        /** @var array<string, BasketLine> $lines */
        $lines = [];

        foreach ($this->items as $product) {
            $quantity = ($lines[$product->code] ?? null)?->quantity ?? 0;
            $lines[$product->code] = new BasketLine($product, $quantity + 1);
        }

        return array_values($lines);
    }
}
