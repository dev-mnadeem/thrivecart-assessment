<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

final readonly class Request
{
    public function __construct(
        public string $method,
        public string $path,
        public string $body = '',
    ) {}

    public static function fromGlobals(): self
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        return new self(
            is_string($method) ? strtoupper($method) : 'GET',
            is_string($uri) ? self::pathOf($uri) : '/',
            (string) file_get_contents('php://input'),
        );
    }

    /**
     * Strips the query string from a request target.
     *
     * parse_url() is not used because it reads "//api/health" as host "api" and path
     * "/health", and returns false for some valid paths such as "/a:1".
     */
    private static function pathOf(string $requestTarget): string
    {
        $path = explode('?', $requestTarget, 2)[0];

        return $path === '' ? '/' : $path;
    }
}
