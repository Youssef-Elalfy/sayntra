<?php

namespace Database\Seeders;

use App\Models\Membership;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local', 'testing')) {
            throw new \RuntimeException('Demo seeding is only allowed locally.');
        }
        $password = getenv('DEMO_SEED_PASSWORD');
        if (! $password || strlen($password) < 12) {
            throw new \RuntimeException('Set DEMO_SEED_PASSWORD to a unique password of at least 12 characters.');
        }
        DB::transaction(function () use ($password) {
            $user = User::firstOrCreate(['email' => 'owner@sayntra.test'], ['name' => 'SAYNTRA Owner', 'password' => $password]);
            $user->markEmailAsVerified();
            $membership = $user->memberships()->first();
            if (! $membership) {
                $org = Organization::create(['name' => 'SAYNTRA Demo Lab', 'category' => 'general']);
                $membership = Membership::create(['organization_id' => $org->id, 'user_id' => $user->id, 'role' => 'owner']);
            }
            $tech = User::firstOrCreate(['email' => 'technician@sayntra.test'], ['name' => 'Demo Technician', 'password' => $password]);
            $tech->markEmailAsVerified();
            Membership::firstOrCreate(['organization_id' => $membership->organization_id, 'user_id' => $tech->id], ['role' => 'technician']);
        });
    }
}
