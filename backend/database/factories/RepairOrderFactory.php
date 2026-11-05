<?php

namespace Database\Factories;

use App\Models\Device;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RepairOrderFactory extends Factory
{
    public function definition(): array
    {
        return ['device_id' => Device::factory(), 'customer_id' => fn (array $a) => Device::findOrFail($a['device_id'])->customer_id, 'public_id' => (string) Str::uuid(), 'reference' => 'SYN-'.strtoupper(Str::random(12)), 'reported_problem' => 'Screen does not turn on', 'device_condition' => 'Light scratches', 'priority' => 'normal', 'received_at' => now(), 'created_by' => User::factory()];
    }
}
