<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

final readonly class JsonResponse
{
    /**
     * Invalid UTF-8 (e.g. echoed from a raw request path) becomes U+FFFD instead of failing.
     */
    private const int ENCODING_FLAGS = JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE;

    /** The encoded JSON body. */
    public string $body;

    /**
     * The body is encoded here, not in send(), so any encoding failure surfaces inside
     * Application::handle() where it is turned into a JSON error response.
     *
     * @param array<string, mixed>  $data
     * @param array<string, string> $headers
     *
     * @throws \JsonException
     */
    public function __construct(
        array $data,
        public int $status = 200,
        public array $headers = [],
    ) {
        $this->body = json_encode($data, self::ENCODING_FLAGS);
    }

    public static function error(HttpException $exception): self
    {
        return new self(
            ['error' => ['code' => $exception->errorCode, 'message' => $exception->getMessage()]],
            $exception->status,
            $exception->headers,
        );
    }

    /**
     * @return array<string, string>
     */
    public function allHeaders(): array
    {
        return ['Content-Type' => 'application/json'] + $this->headers;
    }

    public function send(): void
    {
        http_response_code($this->status);

        foreach ($this->allHeaders() as $name => $value) {
            header(sprintf('%s: %s', $name, $value));
        }

        echo $this->body;
    }
}
