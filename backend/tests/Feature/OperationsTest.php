<?php

namespace Tests\Feature;

use App\Models\Membership;
use App\Models\Organization;
use App\Models\RepairOrder;
use App\Models\User;
use App\Notifications\StaffInvitation;
use App\Tenancy\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OperationsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Organization $org;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create();
        $this->org = Organization::create(['name' => 'Repair Lab', 'category' => 'computer']);
        Membership::create(['organization_id' => $this->org->id, 'user_id' => $this->owner->id, 'role' => 'owner']);
        $this->actingAs($this->owner);
    }

    private function repair(): RepairOrder
    {
        return app(TenantContext::class)->run($this->org->id, fn () => RepairOrder::factory()->create(['created_by' => $this->owner->id]));
    }

    private function technician(): User
    {
        $u = User::factory()->create();
        Membership::create(['organization_id' => $this->org->id, 'user_id' => $u->id, 'role' => 'technician']);

        return $u;
    }

    public function test_customer_device_intake_and_duplicate_prevention(): void
    {
        $customer = $this->postJson('/api/v1/customers', ['name' => 'Mona', 'phone' => '+20 100-1234567'])->assertCreated()->json('data');
        $this->postJson('/api/v1/customers', ['name' => 'Duplicate', 'phone' => '+201001234567'])->assertUnprocessable();
        $device = $this->postJson('/api/v1/devices', ['customer_id' => $customer['id'], 'category' => 'appliance', 'brand' => 'Bosch', 'model' => 'Washer'])->assertCreated()->json('data');
        $repair = $this->postJson('/api/v1/repairs', ['device_id' => $device['id'], 'reported_problem' => 'Does not drain', 'device_condition' => 'Good exterior', 'priority' => 'high'])->assertCreated()->json('data');
        $this->assertDatabaseHas('repair_orders', ['id' => $repair['id'], 'customer_id' => $customer['id'], 'organization_id' => $this->org->id]);
        $this->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.metrics.total_repairs', 1);
    }

    public function test_other_tenant_records_cannot_be_read_changed_or_linked(): void
    {
        $other = Organization::create(['name' => 'Other', 'category' => 'general']);
        $foreign = app(TenantContext::class)->run($other->id, fn () => RepairOrder::factory()->create());
        foreach (['customers' => $foreign->customer_id, 'devices' => $foreign->device_id, 'repairs' => $foreign->id] as $resource => $id) {
            $this->getJson("/api/v1/$resource/$id")->assertNotFound();
            $this->patchJson("/api/v1/$resource/$id", ['name' => 'Intrusion'])->assertNotFound();
        }
        $this->postJson('/api/v1/devices', ['customer_id' => $foreign->customer_id, 'category' => 'computer', 'brand' => 'X', 'model' => 'X'])->assertUnprocessable();
        $this->postJson('/api/v1/repairs', ['device_id' => $foreign->device_id, 'reported_problem' => 'X', 'device_condition' => 'X'])->assertUnprocessable();
        $this->getJson('/api/v1/repairs')->assertJsonCount(0, 'data');
    }

    public function test_assignment_diagnosis_and_transition_guards(): void
    {
        $repair = $this->repair();
        $tech = $this->technician();
        $this->postJson("/api/v1/repairs/$repair->id/transition", ['status' => 'delivered', 'expected_status' => 'received'])->assertUnprocessable();
        $this->postJson("/api/v1/repairs/$repair->id/assign", ['technician_id' => $tech->id])->assertOk()->assertJsonPath('data.status', 'awaiting_diagnosis');
        $this->actingAs($tech)->postJson("/api/v1/repairs/$repair->id/diagnosis", ['findings' => 'Board fault', 'recommended_work' => 'Replace board'])->assertCreated();
        $this->getJson("/api/v1/repairs/$repair->id")->assertOk()->assertJsonMissingPath('data.customer')->assertJsonMissingPath('data.device.serial_number');
        $this->postJson("/api/v1/repairs/$repair->id/transition", ['status' => 'cancelled', 'expected_status' => 'diagnosing'])->assertUnprocessable();
        $this->actingAs($this->owner)->postJson("/api/v1/repairs/$repair->id/transition", ['status' => 'cancelled', 'expected_status' => 'received'])->assertConflict();
        $this->postJson("/api/v1/repairs/$repair->id/transition", ['status' => 'cancelled', 'expected_status' => 'diagnosing'])->assertOk();
        $this->assertDatabaseCount('repair_status_histories', 3);
    }

    public function test_technician_cannot_access_unassigned_repairs_or_customers(): void
    {
        $repair = $this->repair();
        $tech = $this->technician();
        $this->actingAs($tech);
        $this->getJson("/api/v1/repairs/$repair->id")->assertForbidden();
        $this->getJson('/api/v1/repairs')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/customers')->assertForbidden();
    }

    public function test_active_customer_and_last_owner_are_protected(): void
    {
        $repair = $this->repair();
        $this->deleteJson("/api/v1/customers/$repair->customer_id")->assertUnprocessable();
        $member = Membership::where('user_id', $this->owner->id)->first();
        $this->patchJson("/api/v1/team/$member->id", ['role' => 'manager', 'active' => true])->assertUnprocessable();
    }

    public function test_invitation_is_hashed_and_single_use(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/team/invitations', ['email' => 'staff@example.test', 'role' => 'technician'])->assertCreated()->assertJsonMissingPath('data.token_hash');
        $token = '';
        Notification::assertSentOnDemand(StaffInvitation::class, function ($n) use (&$token) {
            $token = $n->token;

            return true;
        });
        $this->assertDatabaseHas('team_invitations', ['token_hash' => hash('sha256', $token)]);
        $this->postJson("/api/v1/invitations/$token/accept", ['name' => 'Technician', 'password' => 'StrongPass123!', 'password_confirmation' => 'StrongPass123!'])->assertOk();
        $this->postJson("/api/v1/invitations/$token/accept",[])->assertNotFound();
    }
}
