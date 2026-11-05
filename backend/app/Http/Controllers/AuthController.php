<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();
        [$user,$org] = DB::transaction(function () use ($data) {
            $user = User::create(['name' => $data['name'], 'email' => $data['email'], 'password' => $data['password'], 'language' => $data['language'] ?? 'en']);
            $org = Organization::create(['name' => $data['organization_name'], 'category' => $data['category'], 'country' => $data['country'], 'phone' => $data['phone'] ?? null, 'email' => $data['email']]);
            Membership::create(['organization_id' => $org->id, 'user_id' => $user->id, 'role' => 'owner']);

            return [$user, $org];
        });
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('organization_id', $org->id);
        event(new Registered($user));

        return response()->json(['data' => $user], 201);
    }

    public function login(LoginRequest $request)
    {
        if (! Auth::guard('web')->attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages(['email' => [__('auth.failed')]]);
        }
        $request->session()->regenerate();
        $request->session()->forget('organization_id');

        return $this->user($request);
    }

    public function user(Request $request)
    {
        $user = $request->user();

        return response()->json(['data' => array_merge($user->toArray(), ['memberships' => $user->memberships()->where('active', true)->with('organization')->get()])]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function forgot(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        Password::sendResetLink($request->only('email'));

        return response()->json(['message' => __('If this email is registered, a reset link has been sent.')]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate(['token' => 'required', 'email' => 'required|email', 'password' => ['required', 'confirmed', PasswordRule::min(12)->mixedCase()->numbers()]]);
        $status = Password::reset($data, function (User $user, string $password) {
            $user->password = $password;
            $user->setRememberToken(Str::random(60));
            $user->save();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            event(new PasswordReset($user));
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => __($status)]);
    }

    public function profile(Request $request)
    {
        $data = $request->validate(['name' => 'sometimes|required|string|max:120', 'language' => 'sometimes|in:en,ar', 'theme' => 'sometimes|in:light,dark,system']);
        $request->user()->update($data);

        return $this->user($request);
    }

    public function password(Request $request)
    {
        $data = $request->validate(['current_password' => 'required|current_password', 'password' => ['required', 'confirmed', PasswordRule::min(12)->mixedCase()->numbers()]]);
        $request->user()->update(['password' => $data['password']]);
        Auth::guard('web')->logoutOtherDevices($data['password']);
        DB::table('sessions')->where('user_id', $request->user()->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return response()->json(['message' => __('Password updated.')]);
    }
}
