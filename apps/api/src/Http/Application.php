<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

use Acme\Basket\Domain\AppliedOffer;
use Acme\Basket\Domain\Basket;
use Acme\Basket\Domain\BasketLine;
use Acme\Basket\Domain\Catalogue;
use Acme\Basket\Domain\DeliveryRules;
use Acme\Basket\Domain\OfferInterface;
use Acme\Basket\Domain\Product;
use Acme\Basket\Domain\UnknownProductException;
use Throwable;

/**
 * Stateless JSON API: list products and price a basket of product codes.
 */
final readonly class Application
{
    /** @var array<string, array<string, string>> path => [method => handler] */
    private const array ROUTES = [
        '/api/health' => ['GET' => 'health'],
        '/api/products' => ['GET' => 'products'],
        '/api/basket/quote' => ['POST' => 'quote'],
    ];

    /**
     * @param list<OfferInterface> $offers
     */
    public function __construct(
        private Catalogue $catalogue,
        private DeliveryRules $deliveryRules,
        private array $offers,
        private QuoteRequestParser $parser = new QuoteRequestParser(),
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        try {
            return $this->dispatch($request);
        } catch (HttpException $exception) {
            return JsonResponse::error($exception);
        } catch (Throwable $exception) {
            error_log((string) $exception);

            return JsonResponse::error(new HttpException(500, 'INTERNAL_ERROR', 'Something went wrong.'));
        }
    }

    private function dispatch(Request $request): JsonResponse
    {
        $methods = self::ROUTES[$request->path]
            ?? throw new HttpException(404, 'NOT_FOUND', sprintf('No route for %s.', $request->path));

        $handler = $methods[$request->method] ?? throw new HttpException(
            405,
            'METHOD_NOT_ALLOWED',
            sprintf('%s is not supported for %s.', $request->method, $request->path),
            ['Allow' => implode(', ', array_keys($methods))],
        );

        return match ($handler) {
            'health' => new JsonResponse(['status' => 'ok']),
            'products' => $this->products(),
            'quote' => $this->quote($request),
        };
    }

    private function products(): JsonResponse
    {
        return new JsonResponse([
            'products' => array_map(static fn (Product $product): array => [
                'code' => $product->code,
                'name' => $product->name,
                'priceCents' => $product->priceCents,
            ], $this->catalogue->all()),
        ]);
    }

    private function quote(Request $request): JsonResponse
    {
        $basket = new Basket($this->catalogue, $this->deliveryRules, $this->offers);

        foreach ($this->parser->parse($request->body) as $code) {
            try {
                $basket->add($code);
            } catch (UnknownProductException $exception) {
                throw HttpException::unprocessable('INVALID_PRODUCT', $exception->getMessage());
            }
        }

        $totals = $basket->breakdown();

        return new JsonResponse([
            'items' => array_map(static fn (BasketLine $line): array => [
                'code' => $line->product->code,
                'name' => $line->product->name,
                'unitPriceCents' => $line->product->priceCents,
                'quantity' => $line->quantity,
                'lineSubtotalCents' => $line->subtotalCents(),
            ], $totals->lines),
            'appliedOffers' => array_map(static fn (AppliedOffer $offer): array => [
                'label' => $offer->label,
                'discountCents' => $offer->discountCents,
            ], $totals->appliedOffers),
            'subtotalCents' => $totals->subtotalCents,
            'discountCents' => $totals->discountCents,
            'discountedSubtotalCents' => $totals->discountedSubtotalCents(),
            'deliveryCents' => $totals->deliveryCents,
            'totalCents' => $totals->totalCents(),
        ]);
    }
}
