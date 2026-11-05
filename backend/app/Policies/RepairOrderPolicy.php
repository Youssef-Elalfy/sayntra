<?php

namespace App\Policies;

use App\Models\RepairOrder;
use App\Models\User;
use App\Tenancy\TenantContext;

class RepairOrderPolicy
{
    public function view(User $user, RepairOrder $repair): bool
    {
        $tenant = app(TenantContext::class);

        return $repair->organization_id === $tenant->id() && $tenant->allows('repairs.read') && ($tenant->role() !== 'technician' || $repair->assigned_technician_id === $user->id);
    }

    public function update(User $user, RepairOrder $repair): bool
    {
        return $this->view($user, $repair) && app(TenantContext::class)->allows('repairs.write');
    }

    public function work(User $user, RepairOrder $repair): bool
    {
        return $this->view($user, $repair) && app(TenantContext::class)->allows('repairs.diagnose');
    }

    public function transition(User $user, RepairOrder $repair): bool
    {
        return $this->view($user, $repair) && app(TenantContext::class)->allows('repairs.transition');
    }

    public function assign(User $user, RepairOrder $repair): bool
    {
        return $this->view($user, $repair) && app(TenantContext::class)->allows('repairs.assign');
    }

    public function deliver(User $user, RepairOrder $repair): bool
    {
        return $this->view($user, $repair) && app(TenantContext::class)->allows('repairs.deliver');
    }
}
