<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->restrictOnDelete();
            $t->string('name', 150);
            $t->string('phone', 25);
            $t->string('alternative_phone', 25)->nullable();
            $t->string('email')->nullable();
            $t->text('address')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();
            $t->softDeletes();
            $t->unique(['organization_id', 'id']);
            $t->unique(['organization_id', 'phone']);
            $t->index(['organization_id', 'name']);
        });
        Schema::create('devices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->restrictOnDelete();
            $t->unsignedBigInteger('customer_id');
            $t->string('category', 50);
            $t->string('brand', 80);
            $t->string('model', 100);
            $t->string('serial_number', 150)->nullable();
            $t->text('description')->nullable();
            $t->json('specifications')->nullable();
            $t->timestamps();
            $t->foreign(['organization_id', 'customer_id'])->references(['organization_id', 'id'])->on('customers')->restrictOnDelete();
            $t->unique(['organization_id', 'id']);
            $t->unique(['organization_id', 'serial_number']);
            $t->index(['organization_id', 'category']);
        });
        Schema::create('repair_orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->restrictOnDelete();
            $t->uuid('public_id')->unique();
            $t->string('reference', 40);
            $t->unsignedBigInteger('customer_id');
            $t->unsignedBigInteger('device_id');
            $t->unsignedBigInteger('assigned_technician_id')->nullable();
            $t->text('reported_problem');
            $t->text('device_condition');
            $t->text('accessories')->nullable();
            $t->string('priority', 15)->default('normal');
            $t->string('status', 40)->default('received');
            $t->text('internal_notes')->nullable();
            $t->text('customer_notes')->nullable();
            $t->text('quality_check_notes')->nullable();
            $t->timestamp('received_at');
            $t->timestamp('expected_at')->nullable();
            $t->timestamp('completed_at')->nullable();
            $t->timestamp('delivered_at')->nullable();
            $t->string('handover_recipient', 150)->nullable();
            $t->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
            $t->unique(['organization_id', 'id']);
            $t->unique(['organization_id', 'reference']);
            $t->index(['organization_id', 'status', 'received_at']);
            $t->index(['organization_id', 'assigned_technician_id', 'status'], 'repair_workload_index');
            $t->foreign(['organization_id', 'customer_id'])->references(['organization_id', 'id'])->on('customers')->restrictOnDelete();
            $t->foreign(['organization_id', 'device_id'])->references(['organization_id', 'id'])->on('devices')->restrictOnDelete();
            $t->foreign(['organization_id', 'assigned_technician_id'], 'repair_technician_membership_fk')->references(['organization_id', 'user_id'])->on('organization_users')->restrictOnDelete();
        });
        foreach (['repair_status_histories', 'repair_assignments', 'diagnoses'] as $table) {
            Schema::create($table, function (Blueprint $t) use ($table) {
                $t->id();
                $t->foreignId('organization_id')->constrained()->restrictOnDelete();
                $t->unsignedBigInteger('repair_order_id');
                $t->foreignId('user_id')->constrained()->restrictOnDelete();
                if ($table === 'repair_status_histories') {
                    $t->string('from_status', 40)->nullable();
                    $t->string('to_status', 40);
                    $t->text('note')->nullable();
                }
                if ($table === 'repair_assignments') {
                    $t->foreignId('technician_id')->constrained('users')->restrictOnDelete();
                }
                if ($table === 'diagnoses') {
                    $t->text('findings');
                    $t->text('recommended_work');
                }
                $t->timestamps();
                $t->index(['organization_id', 'repair_order_id']);
                $t->foreign(['organization_id', 'repair_order_id'])->references(['organization_id', 'id'])->on('repair_orders')->restrictOnDelete();
            });
        }
        Schema::create('team_invitations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('organization_id')->constrained()->restrictOnDelete();
            $t->string('email');
            $t->string('role', 30);
            $t->string('token_hash', 64)->unique();
            $t->timestamp('expires_at');
            $t->timestamp('accepted_at')->nullable();
            $t->foreignId('invited_by')->constrained('users')->restrictOnDelete();
            $t->timestamps();
            $t->index(['organization_id', 'email']);
        });
    }

    public function down(): void
    {
        foreach (['team_invitations', 'diagnoses', 'repair_assignments', 'repair_status_histories', 'repair_orders', 'devices', 'customers'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
