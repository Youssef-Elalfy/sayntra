<?php

namespace App\Http\Resources;

use App\Services\RepairWorkflow;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepairResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tenant = app(TenantContext::class);
        $customerAccess = $tenant->allows('customers.read');

        return ['id' => $this->id, 'reference' => $this->reference, 'public_id' => $this->public_id, 'status' => $this->status, 'priority' => $this->priority, 'reported_problem' => $this->reported_problem, 'device_condition' => $this->device_condition, 'accessories' => $this->accessories, 'customer_notes' => $this->customer_notes, 'internal_notes' => $this->internal_notes, 'received_at' => $this->received_at, 'expected_at' => $this->expected_at, 'completed_at' => $this->completed_at, 'delivered_at' => $this->delivered_at, 'assigned_technician_id' => $this->assigned_technician_id,
            'customer' => $this->when($customerAccess, fn () => ['id' => $this->customer->id, 'name' => $this->customer->name, 'phone' => $this->customer->phone, 'email' => $this->customer->email]),
            'device' => ['id' => $this->device->id, 'category' => $this->device->category, 'brand' => $this->device->brand, 'model' => $this->device->model, 'serial_number' => $this->when($customerAccess, $this->device->serial_number)],
            'technician' => $this->technician?->only('id', 'name'), 'diagnoses' => $this->whenLoaded('diagnoses'), 'histories' => $this->whenLoaded('histories'),
            'allowed_transitions' => RepairWorkflow::availableTransitions($this->resource),
        ];
    }
}
