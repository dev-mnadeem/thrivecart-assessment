<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

header('Content-Type: application/json');

if ($path === '/api/health' && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    echo json_encode(['status' => 'ok'], JSON_THROW_ON_ERROR);

    return;
}

http_response_code(404);
echo json_encode(['error' => ['code' => 'NOT_FOUND', 'message' => 'Route not found.']], JSON_THROW_ON_ERROR);
