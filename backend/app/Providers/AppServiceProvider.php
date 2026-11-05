<?php
namespace App\Providers;
use App\Tenancy\TenantContext;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\{Gate,RateLimiter};
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Auth\Notifications\{ResetPassword,VerifyEmail};
class AppServiceProvider extends ServiceProvider {
    public function register(): void { $this->app->scoped(TenantContext::class,fn()=>new TenantContext()); }
    public function boot(): void {
        Gate::define('permission',fn($user,string $permission)=>app(TenantContext::class)->allows($permission));
        RateLimiter::for('login',fn(Request $r)=>[Limit::perMinute(5)->by(strtolower((string)$r->input('email')).'|'.$r->ip()),Limit::perMinute(30)->by($r->ip())]);
        RateLimiter::for('registration',fn(Request $r)=>Limit::perHour(10)->by($r->ip()));
        RateLimiter::for('api',fn(Request $r)=>Limit::perMinute(180)->by($r->user()?->id?:$r->ip()));
        ResetPassword::createUrlUsing(fn($user,$token)=>config('sayntra.frontend_url').'/reset-password?token='.$token.'&email='.urlencode($user->email));
    }
}
