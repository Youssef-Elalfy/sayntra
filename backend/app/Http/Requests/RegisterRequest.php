<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
class RegisterRequest extends FormRequest {
    public function authorize(): bool { return true; }
    protected function prepareForValidation(): void { $this->merge(['email'=>strtolower(trim((string)$this->input('email')))]); }
    public function rules(): array { return [
        'name'=>['required','string','max:120'], 'email'=>['required','email','max:254','unique:users,email'],
        'password'=>['required','confirmed',Password::min(12)->mixedCase()->numbers()],
        'organization_name'=>['required','string','max:150'], 'category'=>['required','in:mobile,computer,electronics,appliance,general'],
        'country'=>['required','in:EG'], 'language'=>['sometimes','in:ar,en'], 'phone'=>['nullable','string','max:30'],
    ]; }
}
