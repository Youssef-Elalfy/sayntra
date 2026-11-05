<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function(Blueprint $t) { $t->string('language',2)->default('en'); $t->string('theme',10)->default('system'); $t->boolean('is_platform_admin')->default(false); });
        Schema::create('organizations', function(Blueprint $t) {
            $t->id(); $t->uuid('public_id')->unique(); $t->string('name',150); $t->string('category',50); $t->string('country',2)->default('EG');
            $t->string('currency',3)->default('EGP'); $t->string('timezone')->default('Africa/Cairo'); $t->string('email')->nullable(); $t->string('phone',30)->nullable(); $t->text('address')->nullable();
            $t->unsignedSmallInteger('tax_basis_points')->default(0); $t->unsignedSmallInteger('warranty_days')->default(0); $t->boolean('active')->default(true); $t->timestamps();
        });
        Schema::create('organization_users', function(Blueprint $t) {
            $t->id(); $t->foreignId('organization_id')->constrained()->restrictOnDelete(); $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->string('role',30); $t->boolean('active')->default(true); $t->timestamps(); $t->unique(['organization_id','user_id']); $t->index(['user_id','active']);
        });
        Schema::create('activity_logs', function(Blueprint $t) {
            $t->id(); $t->foreignId('organization_id')->constrained()->restrictOnDelete(); $t->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('event',80); $t->string('subject_type',80); $t->unsignedBigInteger('subject_id'); $t->json('metadata')->nullable(); $t->timestamp('created_at')->useCurrent();
            $t->index(['organization_id','subject_type','subject_id']); $t->index(['organization_id','created_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('activity_logs'); Schema::dropIfExists('organization_users'); Schema::dropIfExists('organizations'); Schema::table('users', fn(Blueprint $t) => $t->dropColumn(['language','theme','is_platform_admin'])); }
};
