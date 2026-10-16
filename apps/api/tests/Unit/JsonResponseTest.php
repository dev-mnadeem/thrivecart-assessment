<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Http\JsonResponse;
use JsonException;
use PHPUnit\Framework\TestCase;

final class JsonResponseTest extends TestCase
{
    public function testEncodesDataAsJson(): void
    {
        $response = new JsonResponse(['path' => '/api/products', 'total' => 5437], 201);

        self::assertSame('{"path":"/api/products","total":5437}', $response->body);
        self::assertSame(201, $response->status);
    }

    public function testSubstitutesInvalidUtf8InsteadOfFailing(): void
    {
        $response = new JsonResponse(['message' => "No route for /api/\xff."]);

        self::assertSame(['message' => "No route for /api/\u{FFFD}."], json_decode($response->body, true));
    }

    public function testUnencodableDataFailsAtConstructionNotWhenSending(): void
    {
        $this->expectException(JsonException::class);

        new JsonResponse(['value' => NAN]);
    }
}
