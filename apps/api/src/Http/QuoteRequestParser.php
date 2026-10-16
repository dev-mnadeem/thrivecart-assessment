<?php

declare(strict_types=1);

namespace Acme\Basket\Http;

use JsonException;

/**
 * Turns an untrusted quote request body into a list of product-code strings.
 *
 * Shape problems (bad JSON, missing or non-array "items") are 400s; problems
 * with individual items (wrong type, too many) are 422s. Whether a code exists
 * is decided later by the catalogue.
 */
final readonly class QuoteRequestParser
{
    private const int MAX_CODE_LENGTH = 32;

    public function __construct(private int $maxItems = 100) {}

    /**
     * @return list<string>
     *
     * @throws HttpException
     */
    public function parse(string $body): array
    {
        try {
            $payload = json_decode($body, true, 16, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw HttpException::badRequest('INVALID_JSON', 'Request body must be valid JSON.');
        }

        if (!is_array($payload) || array_is_list($payload) || !array_key_exists('items', $payload)) {
            throw HttpException::badRequest('INVALID_PAYLOAD', 'Request body must be an object with an "items" array.');
        }

        $items = $payload['items'];

        if (!is_array($items) || !array_is_list($items)) {
            throw HttpException::badRequest('INVALID_PAYLOAD', '"items" must be an array of product codes.');
        }

        if (count($items) > $this->maxItems) {
            throw HttpException::unprocessable(
                'TOO_MANY_ITEMS',
                sprintf('A basket can contain at most %d items.', $this->maxItems),
            );
        }

        $codes = [];

        foreach ($items as $index => $item) {
            if (!is_string($item) || $item === '' || strlen($item) > self::MAX_CODE_LENGTH) {
                throw HttpException::unprocessable(
                    'INVALID_ITEM',
                    sprintf('items[%d] must be a non-empty product code string.', $index),
                );
            }

            $codes[] = $item;
        }

        return $codes;
    }
}
