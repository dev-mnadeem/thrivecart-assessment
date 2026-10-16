<?php

declare(strict_types=1);

namespace Acme\Basket\Config;

use Acme\Basket\Domain\Basket;
use Acme\Basket\Domain\Catalogue;
use Acme\Basket\Domain\DeliveryRules;
use Acme\Basket\Domain\DeliveryTier;
use Acme\Basket\Domain\OfferInterface;
use Acme\Basket\Domain\Product;
use Acme\Basket\Domain\RedWidgetHalfPriceOffer;

/**
 * Acme Widget Co's launch catalogue, delivery charges and offers.
 *
 * This is the only place the business values live; the domain classes receive them.
 */
final class DefaultPricing
{
    public static function catalogue(): Catalogue
    {
        return new Catalogue(
            new Product('R01', 'Red Widget', 3295),
            new Product('G01', 'Green Widget', 2495),
            new Product('B01', 'Blue Widget', 795),
        );
    }

    public static function deliveryRules(): DeliveryRules
    {
        return new DeliveryRules(
            new DeliveryTier(minSubtotalCents: 0, chargeCents: 495),
            new DeliveryTier(minSubtotalCents: 5000, chargeCents: 295),
            new DeliveryTier(minSubtotalCents: 9000, chargeCents: 0),
        );
    }

    /**
     * @return list<OfferInterface>
     */
    public static function offers(): array
    {
        return [new RedWidgetHalfPriceOffer()];
    }

    public static function newBasket(): Basket
    {
        return new Basket(self::catalogue(), self::deliveryRules(), self::offers());
    }
}
