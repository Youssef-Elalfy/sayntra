<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Services\Audit;
use App\Services\RepairWorkflow;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    public function index(Request $r): mixed
    {
        Gate::authorize('permission', 'customers.read');
        $r->validate(['search' => 'nullable|string|max:100']);
        $search = $r->string('search')->toString();

        return Customer::when($search, fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")))->withCount('devices', 'repairs')->latest('id')->paginate(20);
    }

    public function store(CustomerRequest $r): JsonResponse
    {
        $item = DB::transaction(function () use ($r) {
            $item = Customer::create($r->validated());
            Audit::record('customer.created', $item);

            return $item;
        });

        return response()->json(['data' => $item], 201);
    }

    public function show(int $customer): array
    {
        Gate::authorize('permission', 'customers.read');

        return ['data' => Customer::with(['devices', 'repairs' => fn ($q) => $q->select('id', 'organization_id', 'customer_id', 'reference', 'status', 'received_at')->latest()->limit(50)])->findOrFail($customer)];
    }

    public function update(CustomerRequest $r, int $customer): array
    {
        return DB::transaction(function () use ($r, $customer) {
            $item = Customer::lockForUpdate()->findOrFail($customer);
            $item->update($r->validated());
            Audit::record('customer.updated', $item, ['fields' => array_keys($r->validated())]);

            return ['data' => $item];
        });
    }

    public function destroy(int $customer): Response
    {
        Gate::authorize('permission', 'customers.write');
        DB::transaction(function () use ($customer) {
            $item = Customer::lockForUpdate()->findOrFail($customer);
            if ($item->repairs()->whereNotIn('status', RepairWorkflow::TERMINAL)->exists()) {
                throw ValidationException::withMessages(['customer' => [__('Complete active repairs before archiving this customer.')]]);
            }$item->delete();
            Audit::record('customer.archived', $item);
        });

        return response()->noContent();
    }
}
