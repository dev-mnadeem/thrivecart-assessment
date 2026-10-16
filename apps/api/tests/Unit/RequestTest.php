<?php

declare(strict_types=1);

namespace Acme\Basket\Tests\Unit;

use Acme\Basket\Http\Request;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class RequestTest extends TestCase
{
    /** @var array<mixed> */
    private array $server;

    protected function setUp(): void
    {
        $this->server = $_SERVER;
    }

    protected function tearDown(): void
    {
        $_SERVER = $this->server;
    }

    /**
     * @return iterable<string, array{string, string}>
     */
    public static function requestTargets(): iterable
    {
        yield 'plain path' => ['/api/products', '/api/products'];
        yield 'query string is dropped' => ['/api/products?page=2&x=?', '/api/products'];
        yield 'double slash is not a host' => ['//api/health', '//api/health'];
        yield 'colon in path' => ['/api/a:1', '/api/a:1'];
        yield 'query only' => ['?x=1', '/'];
    }

    #[DataProvider('requestTargets')]
    public function testTakesThePathFromTheRequestTarget(string $requestUri, string $expectedPath): void
    {
        $_SERVER['REQUEST_URI'] = $requestUri;
        $_SERVER['REQUEST_METHOD'] = 'GET';

        self::assertSame($expectedPath, Request::fromGlobals()->path);
    }

    public function testNormalisesTheMethodToUpperCase(): void
    {
        $_SERVER['REQUEST_URI'] = '/api/basket/quote';
        $_SERVER['REQUEST_METHOD'] = 'post';

        self::assertSame('POST', Request::fromGlobals()->method);
    }

    public function testFallsBackToGetAndRootWhenServerValuesAreMissing(): void
    {
        unset($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);

        $request = Request::fromGlobals();

        self::assertSame('GET', $request->method);
        self::assertSame('/', $request->path);
        self::assertSame('', $request->body);
    }
}
