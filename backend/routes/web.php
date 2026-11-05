<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TeamController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('api/v1/auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:registration');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:login');
    Route::post('reset-password', [AuthController::class, 'reset'])->middleware('throttle:login');
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('user', [AuthController::class, 'user']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::patch('profile', [AuthController::class, 'profile']);
        Route::post('password', [AuthController::class, 'password']);
        Route::post('email/verification-notification', function (Request $r) {
            if (! $r->user()->hasVerifiedEmail()) {
                $r->user()->sendEmailVerificationNotification();
            }

return ['message' => __('Verification email sent.')];
        })->middleware('throttle:6,1');
    
    }); // نهاية مجموعة auth:sanctum

    Route::get('verify-email/{id}/{hash}', function (
        Request $request,
        string $id,
        string $hash
    ) {
        $user = User::findOrFail($id);

        abort_unless(
            hash_equals(
                sha1($user->getEmailForVerification()),
                $hash
            ),
            403,
            'Invalid verification link.'
        );

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect(
            rtrim(config('sayntra.frontend_url'), '/') . '/app'
        );
    })->middleware(['signed', 'throttle:6,1'])
      ->name('verification.verify');

}); // نهاية مجموعة api/v1/auth


Route::get('api/v1/invitations/{token}', [TeamController::class, 'invitation'])->middleware('throttle:20,1');
Route::post('api/v1/invitations/{token}/accept', [TeamController::class, 'accept'])->middleware('throttle:6,1');
