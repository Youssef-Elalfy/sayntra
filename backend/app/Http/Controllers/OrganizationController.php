<?php
namespace App\Http\Controllers;
use App\Models\Organization;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
class OrganizationController extends Controller {
    public function show() { $ctx=app(TenantContext::class); return ['data'=>Organization::findOrFail($ctx->id()),'role'=>$ctx->role(),'permissions'=>config('sayntra.roles.'.$ctx->role(),[])]; }
    public function update(Request $request) {
        Gate::authorize('permission','organization.manage');
        $data=$request->validate(['name'=>'sometimes|required|string|max:150','email'=>'nullable|email','phone'=>'nullable|string|max:30','address'=>'nullable|string|max:1000','timezone'=>'sometimes|timezone','tax_basis_points'=>'sometimes|integer|min:0|max:10000','warranty_days'=>'sometimes|integer|min:0|max:1095']);
        $org=Organization::findOrFail(app(TenantContext::class)->id()); $org->update($data); \App\Services\Audit::record('organization.updated',$org,['fields'=>array_keys($data)]); return $this->show();
    }
}
