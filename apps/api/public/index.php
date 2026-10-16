<?php

declare(strict_types=1);

use Acme\Basket\Config\DefaultPricing;
use Acme\Basket\Http\Application;
use Acme\Basket\Http\Request;

require __DIR__ . '/../vendor/autoload.php';

// Composition root: the only place default pricing is wired into the HTTP layer.
$catalogue = DefaultPricing::catalogue();
$application = new Application(
    $catalogue,
    DefaultPricing::deliveryRules(),
    DefaultPricing::offers($catalogue),
);

$application->handle(Request::fromGlobals())->send();
