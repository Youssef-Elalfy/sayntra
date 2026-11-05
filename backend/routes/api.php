<?php

use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\RepairController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('health', function () {
    DB::select('SELECT 1');

    return ['status' => 'ok', 'service' => 'SAYNTRA API', 'database' => 'connected'];
});
Route::middleware(['auth:sanctum', 'verified', 'tenant', 'throttle:api'])->group(function () {
    Route::get('dashboard', DashboardController::class);
    Route::apiResource('customers', CustomerController::class)->except('destroy');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy']);
    Route::apiResource('devices', DeviceController::class)->except('destroy');
    Route::apiResource('repairs', RepairController::class)->except('destroy');
    Route::post('repairs/{repair}/assign', [RepairController::class, 'assign']);
    Route::post('repairs/{repair}/diagnosis', [RepairController::class, 'diagnosis']);
    Route::post('repairs/{repair}/transition', [RepairController::class, 'transition']);
    Route::get('repairs/{repair}/timeline', [RepairController::class, 'timeline']);
    Route::get('technicians', [TeamController::class, 'technicians']);
    Route::get('team', [TeamController::class, 'index']);
    Route::post('team/invitations', [TeamController::class, 'invite']);
    Route::patch('team/{member}', [TeamController::class, 'update']);
    Route::get('organization', [OrganizationController::class, 'show']);
    Route::patch('organization', [OrganizationController::class, 'update']);
});
