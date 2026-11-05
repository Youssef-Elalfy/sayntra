<?php
namespace Tests;
abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase {
    protected function setUp(): void {
        // Guard before RefreshDatabase starts migrations via parent setUp.
        $this->refreshApplication();
        if (!str_ends_with((string) config('database.connections.mysql.database'), '_test')) throw new \RuntimeException('Tests require an isolated database name ending in _test.');
        parent::setUp();
    }
}
