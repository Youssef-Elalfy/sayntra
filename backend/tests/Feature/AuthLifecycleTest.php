<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_reset_request_does_not_disclose_account_existence(): void
    {
        Notification::fake();
        $user = User::factory()->create();
        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk()->json();
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test'])->assertOk()->json();
        $this->assertSame($known, $unknown);
        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_password_reset_token_is_required_and_single_use(): void
    {
        $user = User::factory()->create();
        $token = Password::createToken($user);
        $data = ['email' => $user->email, 'token' => 'invalid', 'password' => 'NewSecurePass321!', 'password_confirmation' => 'NewSecurePass321!'];
        $this->postJson('/api/v1/auth/reset-password', $data)->assertUnprocessable();
        $data['token'] = $token;
        $this->postJson('/api/v1/auth/reset-password', $data)->assertOk();
        $this->assertTrue(Hash::check($data['password'], $user->fresh()->password));
        $this->postJson('/api/v1/auth/reset-password', $data)->assertUnprocessable();
    }

    public function test_signed_verification_checks_account_identity_and_signature(): void
    {
        $user = User::factory()->unverified()->create();
        $other = User::factory()->unverified()->create();
        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(30), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->actingAs($other)->getJson($url)->assertForbidden();
        $this->actingAs($user)->getJson($url.'&tampered=1')->assertForbidden();
        $this->actingAs($user)->get($url)->assertRedirect(config('sayntra.frontend_url').'/app');
        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_login_is_rate_limited_and_arabic_errors_are_supported(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->withHeader('Accept-Language', 'ar')->postJson('/api/v1/auth/login', ['email' => 'rate@example.test', 'password' => 'wrong'])->assertUnprocessable()->assertJsonPath('errors.email.0', 'بيانات الدخول غير صحيحة.');
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'rate@example.test', 'password' => 'wrong'])->assertTooManyRequests();
    }

    public function test_profile_mass_assignment_cannot_promote_user(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->patchJson('/api/v1/auth/profile', ['name' => 'Updated', 'is_platform_admin' => true, 'email' => 'changed@example.test'])->assertOk();
        $this->assertFalse($user->fresh()->is_platform_admin);
        $this->assertNotSame('changed@example.test', $user->fresh()->email);
    }
}
