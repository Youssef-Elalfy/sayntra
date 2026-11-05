<?php
namespace Tests\Feature;
use App\Models\{User,Organization,Membership,ActivityLog};
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{Event,Notification};
use Tests\TestCase;
class FoundationTest extends TestCase {
    use RefreshDatabase;
    public function test_database_health(): void { $this->getJson('/api/v1/health')->assertOk()->assertJsonPath('database','connected'); }
    public function test_registration_creates_owner_and_organization(): void {
        Event::fake([\Illuminate\Auth\Events\Registered::class]);
        $this->postJson('/api/v1/auth/register',['name'=>'Owner','email'=>'owner@example.test','password'=>'StrongPass123!','password_confirmation'=>'StrongPass123!','organization_name'=>'Repair Lab','category'=>'computer','country'=>'EG'])->assertCreated();
        $this->assertDatabaseHas('organizations',['name'=>'Repair Lab','currency'=>'EGP']); $this->assertDatabaseHas('organization_users',['role'=>'owner']);
        $this->getJson('/api/v1/auth/user')->assertOk()->assertJsonPath('data.email','owner@example.test');
        $this->getJson('/api/v1/organization')->assertForbidden();
    }
    public function test_weak_password_is_rejected(): void { $this->postJson('/api/v1/auth/register',['name'=>'A','email'=>'a@example.test','password'=>'123','password_confirmation'=>'123','organization_name'=>'A','category'=>'general','country'=>'EG'])->assertUnprocessable()->assertJsonValidationErrors('password'); }
    public function test_login_logout_and_invalid_login(): void {
        $user=User::factory()->create(['password'=>'StrongPass123!']);
        $this->postJson('/api/v1/auth/login',['email'=>$user->email,'password'=>'wrong'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login',['email'=>$user->email,'password'=>'StrongPass123!'])->assertOk();
        $this->postJson('/api/v1/auth/logout')->assertNoContent(); $this->assertGuest('web');
    }
    public function test_organization_selection_does_not_cross_membership_boundary(): void {
        $user=User::factory()->create(); $a=Organization::create(['name'=>'A','category'=>'general']); $b=Organization::create(['name'=>'B','category'=>'general']);
        Membership::create(['user_id'=>$user->id,'organization_id'=>$a->id,'role'=>'owner']);
        $this->actingAs($user)->withHeader('Origin','http://localhost:3000')->withSession(['organization_id'=>$b->id])->getJson('/api/v1/organization')->assertForbidden();
    }
    public function test_membership_role_enforces_organization_write(): void {
        $user=User::factory()->create(); $org=Organization::create(['name'=>'A','category'=>'general']);
        Membership::create(['user_id'=>$user->id,'organization_id'=>$org->id,'role'=>'technician']);
        $this->actingAs($user)->getJson('/api/v1/organization')->assertOk()->assertJsonPath('role','technician');
        $this->actingAs($user)->patchJson('/api/v1/organization',['name'=>'Changed'])->assertForbidden();
    }
    public function test_tenant_queries_fail_closed_without_context(): void {
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class); ActivityLog::count();
    }
    public function test_inactive_membership_is_denied(): void {
        $user=User::factory()->create(); $org=Organization::create(['name'=>'A','category'=>'general']); Membership::create(['user_id'=>$user->id,'organization_id'=>$org->id,'role'=>'owner','active'=>false]);
        $this->actingAs($user)->getJson('/api/v1/organization')->assertForbidden();
    }
}
