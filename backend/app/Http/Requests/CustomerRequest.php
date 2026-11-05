<?php

namespace App\Http\Requests;

use App\Tenancy\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return app(TenantContext::class)->allows('customers.write');
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge(['phone' => preg_replace('/[\s()\-]/', '', (string) $this->input('phone'))]);
        }
    }

    public function rules(): array
    {
        $id = $this->route('customer');
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return ['name' => [$required, 'required', 'string', 'max:150'], 'phone' => [$required, 'required', 'regex:/^\+?[0-9]{7,15}$/', Rule::unique('customers', 'phone')->where('organization_id', app(TenantContext::class)->id())->ignore($id)], 'alternative_phone' => 'nullable|string|max:25', 'email' => 'nullable|email|max:254', 'address' => 'nullable|string|max:1000', 'notes' => 'nullable|string|max:3000'];
    }
}
