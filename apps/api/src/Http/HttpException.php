<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

use RuntimeException;

/**
 * An error that maps directly to an HTTP response with a stable error code.
 */
final class HttpException extends RuntimeException
{
    /**
     * @param array<string, string> $headers
     */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message,
        public readonly array $headers = [],
    ) {
        parent::__construct($message);
    }

    public static function badRequest(string $errorCode, string $message): self
    {
        return new self(400, $errorCode, $message);
    }

    public static function unprocessable(string $errorCode, string $message): self
    {
        return new self(422, $errorCode, $message);
    }
}
