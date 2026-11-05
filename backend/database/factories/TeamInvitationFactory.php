<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TeamInvitationFactory extends Factory
{
    public function definition(): array
    {
        return ['email' => fake()->unique()->safeEmail(), 'role' => 'technician', 'token_hash' => hash('sha256', Str::random(64)), 'expires_at' => now()->addHours(72), 'invited_by' => User::factory()];
    }
}
