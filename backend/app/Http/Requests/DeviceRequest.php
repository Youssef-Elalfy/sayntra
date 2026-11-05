<?php

namespace App\Http\Requests;

use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->allows('devices.write');
    }

    public function rules(): array
    {
        $org = app(TenantContext::class)->id();
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return ['customer_id' => [$required, 'integer', Rule::exists('customers', 'id')->where('organization_id', $org)->whereNull('deleted_at')], 'category' => [$required, 'in:mobile,computer,electronics,appliance,general'], 'brand' => [$required, 'string', 'max:80'], 'model' => [$required, 'string', 'max:100'], 'serial_number' => ['nullable', 'string', 'max:150', Rule::unique('devices', 'serial_number')->where('organization_id', $org)->ignore($this->route('device'))], 'description' => 'nullable|string|max:2000', 'specifications' => 'nullable|array'];
    }
}
