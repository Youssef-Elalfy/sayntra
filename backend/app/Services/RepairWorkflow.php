<?php

namespace App\Services;

use App\Models\Diagnosis;
use App\Models\Membership;
use App\Models\RepairAssignment;
use App\Models\RepairOrder;
use App\Models\RepairStatusHistory;
use App\Tenancy\TenantContext;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

final class RepairWorkflow
{
    public const TERMINAL = ['delivered', 'cancelled', 'returned_without_repair'];

    public const TRANSITIONS = [
        'received' => ['awaiting_diagnosis', 'cancelled'],
        'awaiting_diagnosis' => ['diagnosing', 'cancelled'],
        'diagnosing' => ['unrepairable', 'cancelled'],
        'awaiting_customer_approval' => ['cancelled'],
        'approved' => ['in_repair', 'cancelled'],
        'in_repair' => ['awaiting_parts', 'quality_check', 'unrepairable'],
        'awaiting_parts' => ['in_repair', 'cancelled'],
        'quality_check' => ['in_repair', 'ready_for_pickup'],
        'ready_for_pickup' => [], 'estimate_rejected' => [], 'unrepairable' => [],
        'delivered' => [], 'cancelled' => [], 'returned_without_repair' => [],
    ];

    public static function availableTransitions(RepairOrder $repair): array
    {
        if (! app(TenantContext::class)->allows('repairs.transition')) {
            return [];
        }
        $allowed = self::TRANSITIONS[$repair->status] ?? [];
        if (app(TenantContext::class)->role() === 'technician') {
            $allowed = array_values(array_diff($allowed, ['cancelled', 'ready_for_pickup']));
        }

        return $allowed;
    }

    public function move(RepairOrder $repair, string $status, ?string $note = null): RepairOrder
    {
        $old = $repair->status;
        $repair->status = $status;
        if ($status === 'ready_for_pickup') {
            $repair->completed_at = now();
        }
        $repair->save();
        RepairStatusHistory::create(['repair_order_id' => $repair->id, 'user_id' => auth()->id(), 'from_status' => $old, 'to_status' => $status, 'note' => $note]);
        Audit::record('repair.status_changed', $repair, ['from' => $old, 'to' => $status]);

        return $repair;
    }

    public function transition(RepairOrder $repair, array $data): RepairOrder
    {
        return DB::transaction(function () use ($repair, $data) {
            $repair = RepairOrder::lockForUpdate()->findOrFail($repair->id);
            Gate::authorize('transition', $repair);
            if ($repair->status !== $data['expected_status']) {
                abort(409, __('This repair changed. Refresh and try again.'));
            }
            if (! in_array($data['status'], self::availableTransitions($repair), true)) {
                throw ValidationException::withMessages(['status' => [__('This status transition is not allowed.')]]);
            }
            if (in_array($data['status'], ['diagnosing', 'in_repair'], true) && ! $repair->assigned_technician_id) {
                throw ValidationException::withMessages(['technician' => [__('Assign a technician first.')]]);
            }
            if ($data['status'] === 'ready_for_pickup') {
                if (empty($data['quality_check_notes'])) {
                    throw ValidationException::withMessages(['quality_check_notes' => [__('Record the quality check results.')]]);
                }
                $repair->quality_check_notes = $data['quality_check_notes'];
            }

            return $this->move($repair, $data['status'], $data['note'] ?? null);
        }, 3);
    }

    public function assign(RepairOrder $repair, int $technicianId): RepairOrder
    {
        return DB::transaction(function () use ($repair, $technicianId) {
            $repair = RepairOrder::lockForUpdate()->findOrFail($repair->id);
            Gate::authorize('assign', $repair);
            if (in_array($repair->status, self::TERMINAL, true)) {
                throw ValidationException::withMessages(['repair' => [__('Closed repairs cannot be reassigned.')]]);
            }
            Membership::where('organization_id', app(TenantContext::class)->id())->where('user_id', $technicianId)->where('role', 'technician')->where('active', true)->firstOrFail();
            $repair->assigned_technician_id = $technicianId;
            $repair->save();
            RepairAssignment::create(['repair_order_id' => $repair->id, 'technician_id' => $technicianId, 'user_id' => auth()->id()]);
            Audit::record('repair.assigned', $repair, ['technician_id' => $technicianId]);
            if ($repair->status === 'received') {
                $this->move($repair, 'awaiting_diagnosis');
            }

            return $repair;
        }, 3);
    }

    public function diagnose(RepairOrder $repair, array $data): Diagnosis
    {
        return DB::transaction(function () use ($repair, $data) {
            $repair = RepairOrder::lockForUpdate()->findOrFail($repair->id);
            Gate::authorize('work', $repair);
            if (! in_array($repair->status, ['awaiting_diagnosis', 'diagnosing'], true) || ! $repair->assigned_technician_id) {
                throw ValidationException::withMessages(['repair' => [__('Assign this repair and start diagnosis first.')]]);
            }
            if ($repair->status === 'awaiting_diagnosis') {
                $this->move($repair, 'diagnosing');
            }
            $diagnosis = Diagnosis::create($data + ['repair_order_id' => $repair->id, 'user_id' => auth()->id()]);
            Audit::record('repair.diagnosed',$repair);

            return $diagnosis;
        }, 3);
    }
}
