<?php

declare(strict_types=1);

use Acme\Basket\Config\DefaultPricing;
use Acme\Basket\Http\Application;
use Acme\Basket\Http\Request;

require __DIR__ . '/../vendor/autoload.php';

// Composition root: the only place default pricing is wired into the HTTP layer.
$application = new Application(
    DefaultPricing::catalogue(),
    DefaultPricing::deliveryRules(),
    DefaultPricing::offers(),
);

$application->handle(Request::fromGlobals())->send();
