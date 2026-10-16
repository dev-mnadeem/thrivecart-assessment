<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

final readonly class JsonResponse
{
    /**
     * @param array<string, mixed>  $data
     * @param array<string, string> $headers
     */
    public function __construct(
        public array $data,
        public int $status = 200,
        public array $headers = [],
    ) {}

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

    public function body(): string
    {
        return json_encode($this->data, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
    }

    public function send(): void
    {
        http_response_code($this->status);

        foreach ($this->allHeaders() as $name => $value) {
            header(sprintf('%s: %s', $name, $value));
        }

        echo $this->body();
    }
}
