<?php

namespace App\Http\Controllers;

use App\Http\Requests\RepairRequest;
use App\Http\Resources\RepairResource;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\Device;
use App\Models\RepairOrder;
use App\Models\RepairStatusHistory;
use App\Services\Audit;
use App\Services\RepairWorkflow;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RepairController extends Controller
{
    public function __construct(private RepairWorkflow $workflow) {}

    public function index(Request $r): mixed
    {
        Gate::authorize('permission', 'repairs.read');
        $r->validate(['search' => 'nullable|string|max:100', 'status' => 'nullable|string|max:40', 'priority' => 'nullable|in:low,normal,high,urgent']);
        $q = RepairOrder::with(['customer', 'device', 'technician']);
        if (app(TenantContext::class)->role() === 'technician') {
            $q->where('assigned_technician_id', $r->user()->id);
        }
        $s = $r->string('search')->toString();
        $q->when($s, fn ($q) => $q->where('reference', 'like', "%{$s}%"))->when($r->status, fn ($q) => $q->where('status', $r->status))->when($r->priority, fn ($q) => $q->where('priority', $r->priority));

        return RepairResource::collection($q->latest('id')->paginate(20));
    }

    public function store(RepairRequest $r): mixed
    {
        $repair = DB::transaction(function () use ($r) {
            $data = $r->validated();
            $device = Device::lockForUpdate()->findOrFail($data['device_id']);
            Customer::findOrFail($device->customer_id);
            $repair = RepairOrder::create($data + ['customer_id' => $device->customer_id, 'public_id' => (string) Str::uuid(), 'reference' => 'SYN-'.strtoupper(Str::random(12)), 'received_at' => now(), 'created_by' => $r->user()->id]);
            $repair->reference = 'SYN-'.now()->format('ym').'-'.str_pad((string) $repair->id, 6, '0', STR_PAD_LEFT);
            $repair->save();
            RepairStatusHistory::create(['repair_order_id' => $repair->id, 'user_id' => $r->user()->id, 'to_status' => 'received']);
            Audit::record('repair.created', $repair);

            return $repair;
        });

        return (new RepairResource($repair->load('customer', 'device', 'technician')))->response()->setStatusCode(201);
    }

    public function show(int $repair): RepairResource
    {
        $item = RepairOrder::with('customer', 'device', 'technician', 'histories', 'diagnoses')->findOrFail($repair);
        Gate::authorize('view', $item);

        return new RepairResource($item);
    }

    public function update(Request $r, int $repair): RepairResource
    {
        $data = $r->validate(['priority' => 'sometimes|in:low,normal,high,urgent', 'expected_at' => 'nullable|date', 'internal_notes' => 'nullable|string|max:3000', 'customer_notes' => 'nullable|string|max:3000']);
        $item = DB::transaction(function () use ($repair, $data) {
            $item = RepairOrder::lockForUpdate()->findOrFail($repair);
            Gate::authorize('update', $item);
            if (in_array($item->status, RepairWorkflow::TERMINAL, true)) {
                throw ValidationException::withMessages(['repair' => [__('Closed repairs are read-only.')]]);
            }$item->update($data);
            Audit::record('repair.updated', $item, ['fields' => array_keys($data)]);

            return $item;
        });

        return new RepairResource($item->load('customer', 'device', 'technician'));
    }

    public function assign(Request $r, int $repair): RepairResource
    {
        $data = $r->validate(['technician_id' => 'required|integer']);
        $item = $this->workflow->assign(RepairOrder::findOrFail($repair), $data['technician_id']);

        return new RepairResource($item->load('customer', 'device', 'technician'));
    }

    public function diagnosis(Request $r, int $repair): mixed
    {
        $data = $r->validate(['findings' => 'required|string|max:5000', 'recommended_work' => 'required|string|max:5000']);
        $diagnosis = $this->workflow->diagnose(RepairOrder::findOrFail($repair), $data);

        return response()->json(['data' => $diagnosis], 201);
    }

    public function transition(Request $r, int $repair): RepairResource
    {
        $data = $r->validate(['status' => 'required|string|max:40', 'expected_status' => 'required|string|max:40', 'note' => 'nullable|string|max:1000', 'quality_check_notes' => 'nullable|string|min:5|max:3000']);
        $item = $this->workflow->transition(RepairOrder::findOrFail($repair), $data);

        return new RepairResource($item->load('customer', 'device', 'technician'));
    }

    public function timeline(int $repair): array
    {
        $item = RepairOrder::findOrFail($repair);
        Gate::authorize('view', $item);

        return ['data' => ActivityLog::where('subject_type', 'repair_orders')->where('subject_id',$item->id)->latest('id')->limit(200)->get(['id', 'event', 'user_id', 'created_at'])];
    }
}
