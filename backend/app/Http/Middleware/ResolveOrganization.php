<?php
namespace App\Http\Middleware;
use App\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
class ResolveOrganization {
    public function handle(Request $request, Closure $next) {
        $selected = $request->hasSession() ? $request->session()->get('organization_id') : null;
        $membership = $request->user()->memberships()->where('active',true)->when($selected,fn($q)=>$q->where('organization_id',$selected))->with('organization')->first();
        abort_unless($membership && $membership->organization->active,403,'An active organization membership is required.');
        $tenant = app(TenantContext::class); $tenant->set($membership->organization_id,$membership->role);
        try { return $next($request); } finally { $tenant->clear(); }
    }
}
