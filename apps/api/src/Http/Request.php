<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

final readonly class Request
{
    public function __construct(
        public string $method,
        public string $path,
        public string $body = '',
    ) {
    }

    public static function fromGlobals(): self
    {
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            is_string($path) ? $path : '/',
            (string) file_get_contents('php://input'),
        );
    }
}
