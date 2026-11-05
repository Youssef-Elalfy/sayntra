<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeviceRequest;
use App\Models\Customer;
use App\Models\Device;
use App\Services\Audit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class DeviceController extends Controller
{
    public function index(Request $r): mixed
    {
        Gate::authorize('permission', 'devices.read');
        $r->validate(['search' => 'nullable|string|max:100', 'customer_id' => 'nullable|integer']);
        $s = $r->string('search')->toString();

        return Device::with('customer:id,organization_id,name')->when($r->customer_id, fn ($q) => $q->where('customer_id', $r->integer('customer_id')))->when($s, fn ($q) => $q->where(fn ($q) => $q->where('model', 'like', "%{$s}%")->orWhere('brand', 'like', "%{$s}%")))->latest('id')->paginate(20);
    }

    public function store(DeviceRequest $r): JsonResponse
    {
        $item = DB::transaction(function () use ($r) {
            Customer::lockForUpdate()->findOrFail($r->integer('customer_id'));
            $item = Device::create($r->validated());
            Audit::record('device.created', $item);

            return $item;
        });

        return response()->json(['data' => $item], 201);
    }

    public function show(int $device): array
    {
        Gate::authorize('permission', 'devices.read');

        return ['data' => Device::with(['customer', 'repairs' => fn ($q) => $q->latest()->limit(50)])->findOrFail($device)];
    }

    public function update(DeviceRequest $r, int $device): array
    {
        return DB::transaction(function () use ($r, $device) {
            $item = Device::lockForUpdate()->findOrFail($device);
            if ($r->has('customer_id') && $r->integer('customer_id') !== $item->customer_id && $item->repairs()->exists()) {
                throw ValidationException::withMessages(['customer_id' => [__('Devices with repair history cannot be transferred to another customer.')]]);
            }$item->update($r->validated());
            Audit::record('device.updated', $item);

            return ['data' => $item];
        });
    }
}
