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
        $path = is_string($uri) ? parse_url($uri, PHP_URL_PATH) : null;

        return new self(
            is_string($method) ? strtoupper($method) : 'GET',
            is_string($path) ? $path : '/',
            (string) file_get_contents('php://input'),
        );
    }
}
