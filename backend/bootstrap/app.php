<?php

use App\Http\Middleware\LocaleAndHeaders;
use App\Http\Middleware\ResolveOrganization;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(web: __DIR__.'/../routes/web.php', api: __DIR__.'/../routes/api.php', apiPrefix: 'api/v1', commands: __DIR__.'/../routes/console.php', health: '/up')
    ->withMiddleware(function (Middleware $m): void {
        $m->statefulApi();
        $m->redirectGuestsTo(fn () => config('sayntra.frontend_url').'/login');
        $m->alias(['tenant' => ResolveOrganization::class]);
        $m->append(LocaleAndHeaders::class);
    })
    ->withExceptions(fn (Exceptions $e) => $e->shouldRenderJsonWhen(fn (Request $r) => $r->is('api/*') || $r->expectsJson()))->create();
