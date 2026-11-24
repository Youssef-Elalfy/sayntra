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
        // Behind a hosting load balancer (and the Vercel proxy), trust the
        // configured proxies so HTTPS, host and client IP are detected
        // correctly. Unset locally; never "*" unless the API is only
        // reachable through those proxies.
        $proxies = env('TRUSTED_PROXIES');
        if (is_string($proxies) && $proxies !== '') {
            $m->trustProxies(at: $proxies === '*' ? '*' : array_map('trim', explode(',', $proxies)));
        }
        $m->statefulApi();
        $m->redirectGuestsTo(fn () => config('sayntra.frontend_url').'/login');
        $m->alias(['tenant' => ResolveOrganization::class]);
        $m->append(LocaleAndHeaders::class);
    })
    ->withExceptions(fn (Exceptions $e) => $e->shouldRenderJsonWhen(fn (Request $r) => $r->is('api/*') || $r->expectsJson()))->create();
