<?php

namespace App\Http\Controllers;

use App\Http\Resources\RepairResource;
use App\Models\ActivityLog;
use App\Models\Customer;
use App\Models\RepairOrder;
use App\Services\RepairWorkflow;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $r): array
    {
        $ctx = app(TenantContext::class);
        $data = ['metrics' => [], 'status_counts' => [], 'volume' => [], 'recent_repairs' => [], 'activity' => []];
        if ($ctx->allows('repairs.read')) {
            $q = RepairOrder::query();
            if ($ctx->role() === 'technician') {
                $q->where('assigned_technician_id', $r->user()->id);
            }
            $data['metrics'] = ['total_repairs' => (clone $q)->count(), 'active_repairs' => (clone $q)->whereNotIn('status', RepairWorkflow::TERMINAL)->count(), 'awaiting_approval' => (clone $q)->where('status', 'awaiting_customer_approval')->count(), 'ready_for_pickup' => (clone $q)->where('status', 'ready_for_pickup')->count()];
            $data['status_counts'] = (clone $q)->selectRaw('status, COUNT(*) as count')->groupBy('status')->get();
            $data['volume'] = (clone $q)->where('received_at', '>=', now()->subDays(30))->selectRaw('DATE(received_at) as date, COUNT(*) as count')->groupByRaw('DATE(received_at)')->orderBy('date')->get();
            $data['recent_repairs'] = RepairResource::collection((clone $q)->with('customer', 'device', 'technician')->latest('id')->limit(6)->get());
        }
        if ($ctx->allows('customers.read')) {
            $data['metrics']['customers'] = Customer::count();
        }
        $data['activity'] = ActivityLog::when($ctx->role() !== 'owner' && $ctx->role() !== 'manager', fn ($q) => $q->where('user_id', $r->user()->id))->latest('id')->limit(8)->get(['id', 'event', 'created_at']);

        return ['data' => $data];
    }
}
