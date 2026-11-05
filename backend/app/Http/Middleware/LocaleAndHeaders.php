<?php
namespace App\Http\Middleware;
use Closure;
use Illuminate\Http\Request;
class LocaleAndHeaders {
    public function handle(Request $request, Closure $next) {
        app()->setLocale(str_starts_with($request->header('Accept-Language','en'),'ar') ? 'ar' : 'en');
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options','nosniff'); $response->headers->set('X-Frame-Options','DENY');
        $response->headers->set('Referrer-Policy','no-referrer');
        if ($request->is('api/*')) $response->headers->set('Cache-Control','private, no-store');
        return $response;
    }
}
