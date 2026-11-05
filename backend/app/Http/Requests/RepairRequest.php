<?php

namespace App\Http\Requests;

use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RepairRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->allows('repairs.write');
    }

    public function rules(): array
    {
        $org = app(TenantContext::class)->id();

        return ['device_id' => ['required', 'integer', Rule::exists('devices', 'id')->where('organization_id', $org)], 'reported_problem' => 'required|string|max:5000', 'device_condition' => 'required|string|max:3000', 'accessories' => 'nullable|string|max:1500', 'priority' => 'required|in:low,normal,high,urgent', 'expected_at' => 'nullable|date|after_or_equal:today', 'customer_notes' => 'nullable|string|max:3000', 'internal_notes' => 'nullable|string|max:3000'];
    }
}
