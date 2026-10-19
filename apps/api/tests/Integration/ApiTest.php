<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Integration;

use Acme\Basket\Config\DefaultPricing;
use Acme\Basket\Http\Application;
use Acme\Basket\Http\JsonResponse;
use Acme\Basket\Http\QuoteRequestParser;
use Acme\Basket\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Drives the HTTP application in-process, exactly as public/index.php does.
 */
final class ApiTest extends TestCase
{
    private Application $app;

    protected function setUp(): void
    {
        $this->app = new Application(
            DefaultPricing::catalogue(),
            DefaultPricing::deliveryRules(),
            DefaultPricing::offers(),
            new QuoteRequestParser(maxItems: 100),
        );
    }

    public function testHealth(): void
    {
        $response = $this->app->handle(new Request('GET', '/api/health'));

        self::assertSame(200, $response->status);
        self::assertSame(['status' => 'ok'], self::decode($response));
    }

    public function testListsProducts(): void
    {
        $response = $this->app->handle(new Request('GET', '/api/products'));

        self::assertSame(200, $response->status);
        self::assertSame('application/json', $response->allHeaders()['Content-Type']);
        self::assertSame([
            'products' => [
                ['code' => 'R01', 'name' => 'Red Widget', 'priceCents' => 3295],
                ['code' => 'G01', 'name' => 'Green Widget', 'priceCents' => 2495],
                ['code' => 'B01', 'name' => 'Blue Widget', 'priceCents' => 795],
            ],
        ], self::decode($response));
    }

    public function testQuotesABasketWithFullBreakdown(): void
    {
        $response = $this->quote('{"items":["R01","R01","B01"]}');

        self::assertSame(200, $response->status);
        self::assertSame('application/json', $response->allHeaders()['Content-Type']);
        self::assertSame([
            'items' => [
                ['code' => 'R01', 'name' => 'Red Widget', 'unitPriceCents' => 3295, 'quantity' => 2, 'lineSubtotalCents' => 6590],
                ['code' => 'B01', 'name' => 'Blue Widget', 'unitPriceCents' => 795, 'quantity' => 1, 'lineSubtotalCents' => 795],
            ],
            'appliedOffers' => [
                ['label' => 'Red Widget: buy one, get the second half price', 'discountCents' => 1648],
            ],
            'subtotalCents' => 7385,
            'discountCents' => 1648,
            'discountedSubtotalCents' => 5737,
            'deliveryCents' => 295,
            'totalCents' => 6032,
        ], self::decode($response));
    }

    /**
     * @return iterable<string, array{string, int}>
     */
    public static function assessmentExamples(): iterable
    {
        yield 'B01, G01' => ['["B01","G01"]', 3785];
        yield 'R01, R01' => ['["R01","R01"]', 5437];
        yield 'R01, G01' => ['["R01","G01"]', 6085];
        yield 'B01, B01, R01, R01, R01' => ['["B01","B01","R01","R01","R01"]', 9827];
    }

    #[DataProvider('assessmentExamples')]
    public function testQuotesAssessmentExamples(string $items, int $expectedTotalCents): void
    {
        $response = $this->quote(sprintf('{"items":%s}', $items));

        self::assertSame(200, $response->status);
        self::assertSame($expectedTotalCents, self::decode($response)['totalCents']);
    }

    public function testQuotesAnEmptyBasket(): void
    {
        $data = self::decode($this->quote('{"items":[]}'));

        self::assertSame([], $data['items']);
        self::assertSame(0, $data['deliveryCents']);
        self::assertSame(0, $data['totalCents']);
    }

    public function testIgnoresClientSuppliedAmounts(): void
    {
        $data = self::decode($this->quote('{"items":["B01"],"totalCents":1,"deliveryCents":0}'));

        self::assertSame(1290, $data['totalCents']);
    }

    /**
     * @return iterable<string, array{string, int, string}>
     */
    public static function invalidQuotes(): iterable
    {
        yield 'malformed JSON' => ['{"items":', 400, 'INVALID_JSON'];
        yield 'empty body' => ['', 400, 'INVALID_JSON'];
        yield 'JSON array instead of object' => ['["R01"]', 400, 'INVALID_PAYLOAD'];
        yield 'JSON scalar' => ['"R01"', 400, 'INVALID_PAYLOAD'];
        yield 'missing items' => ['{"products":["R01"]}', 400, 'INVALID_PAYLOAD'];
        yield 'items is a string' => ['{"items":"R01"}', 400, 'INVALID_PAYLOAD'];
        yield 'items is an object' => ['{"items":{"a":"R01"}}', 400, 'INVALID_PAYLOAD'];
        yield 'number item' => ['{"items":["R01",42]}', 422, 'INVALID_ITEM'];
        yield 'null item' => ['{"items":[null]}', 422, 'INVALID_ITEM'];
        yield 'empty string item' => ['{"items":[""]}', 422, 'INVALID_ITEM'];
        yield 'unknown code' => ['{"items":["R01","XYZ"]}', 422, 'INVALID_PRODUCT'];
        yield 'lowercase code' => ['{"items":["r01"]}', 422, 'INVALID_PRODUCT'];
    }

    #[DataProvider('invalidQuotes')]
    public function testRejectsInvalidQuotes(string $body, int $expectedStatus, string $expectedCode): void
    {
        $response = $this->quote($body);
        $error = self::decode($response)['error'];

        self::assertSame($expectedStatus, $response->status);
        self::assertSame('application/json', $response->allHeaders()['Content-Type']);
        self::assertIsArray($error);
        self::assertSame($expectedCode, $error['code']);
        self::assertIsString($error['message']);
    }

    public function testUnknownProductErrorNamesTheCode(): void
    {
        self::assertSame(
            ['error' => ['code' => 'INVALID_PRODUCT', 'message' => 'Unknown product code: XYZ']],
            self::decode($this->quote('{"items":["XYZ"]}')),
        );
    }

    public function testCapsBasketSize(): void
    {
        $atLimit = $this->quote(json_encode(['items' => array_fill(0, 100, 'B01')], JSON_THROW_ON_ERROR));
        $overLimit = $this->quote(json_encode(['items' => array_fill(0, 101, 'B01')], JSON_THROW_ON_ERROR));

        self::assertSame(200, $atLimit->status);
        self::assertSame(422, $overLimit->status);
        self::assertSame(
            ['error' => ['code' => 'TOO_MANY_ITEMS', 'message' => 'A basket can contain at most 100 items.']],
            self::decode($overLimit),
        );
    }

    public function testUnknownRouteIs404(): void
    {
        $response = $this->app->handle(new Request('GET', '/api/nope'));

        self::assertSame(404, $response->status);
        self::assertSame(
            ['error' => ['code' => 'NOT_FOUND', 'message' => 'No route for /api/nope.']],
            self::decode($response),
        );
    }

    public function testUnknownRouteWithMalformedUtf8StillReturnsJson(): void
    {
        $response = $this->app->handle(new Request('GET', "/api/\xff"));

        self::assertSame(404, $response->status);
        self::assertSame(
            ['error' => ['code' => 'NOT_FOUND', 'message' => "No route for /api/\u{FFFD}."]],
            self::decode($response),
        );
    }

    public function testUnsupportedMalformedUtf8MethodStillReturnsJson(): void
    {
        $response = $this->app->handle(new Request("\xff", '/api/products'));
        $error = self::decode($response)['error'];

        self::assertSame(405, $response->status);
        self::assertSame('GET', $response->allHeaders()['Allow']);
        self::assertIsArray($error);
        self::assertSame('METHOD_NOT_ALLOWED', $error['code']);
    }

    /**
     * @return iterable<string, array{string, string, string}>
     */
    public static function unsupportedMethods(): iterable
    {
        yield 'POST products' => ['POST', '/api/products', 'GET'];
        yield 'GET quote' => ['GET', '/api/basket/quote', 'POST'];
        yield 'DELETE quote' => ['DELETE', '/api/basket/quote', 'POST'];
    }

    #[DataProvider('unsupportedMethods')]
    public function testUnsupportedMethodIs405WithAllowHeader(string $method, string $path, string $allow): void
    {
        $response = $this->app->handle(new Request($method, $path));
        $error = self::decode($response)['error'];

        self::assertSame(405, $response->status);
        self::assertSame($allow, $response->allHeaders()['Allow']);
        self::assertIsArray($error);
        self::assertSame('METHOD_NOT_ALLOWED', $error['code']);
    }

    private function quote(string $body): JsonResponse
    {
        return $this->app->handle(new Request('POST', '/api/basket/quote', $body));
    }

    /**
     * @return array<string, mixed>
     */
    private static function decode(JsonResponse $response): array
    {
        $data = json_decode($response->body, true, 512, JSON_THROW_ON_ERROR);
        self::assertIsArray($data);

        /** @var array<string, mixed> $data */
        return $data;
    }
}
