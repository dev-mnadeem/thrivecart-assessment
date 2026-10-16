<?php

declare(strict_types=1);

/**
 * Runs `php -l` over every PHP file in the given directories.
 *
 * PHP has no compile step, so this is the API's "build": it fails fast on
 * syntax errors without relying on shell globbing.
 */

$arguments = $_SERVER['argv'] ?? [];
$directories = is_array($arguments) ? array_filter(array_slice($arguments, 1), is_string(...)) : [];
$failures = 0;
$checked = 0;

foreach ($directories as $directory) {
    $path = __DIR__ . '/../' . $directory;

    if (!is_dir($path)) {
        continue;
    }

    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS));

    foreach ($files as $file) {
        if (!$file instanceof SplFileInfo || $file->getExtension() !== 'php') {
            continue;
        }

        $output = [];
        $exitCode = 0;
        exec(escapeshellarg(PHP_BINARY) . ' -l ' . escapeshellarg($file->getPathname()) . ' 2>&1', $output, $exitCode);
        $checked++;

        if ($exitCode !== 0) {
            $failures++;
            fwrite(STDERR, implode(PHP_EOL, $output) . PHP_EOL);
        }
    }
}

echo sprintf('Checked %d PHP file(s), %d with syntax errors.', $checked, $failures) . PHP_EOL;

exit($failures === 0 ? 0 : 1);
