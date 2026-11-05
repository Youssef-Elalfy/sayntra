<?php

namespace Database\Factories;

use App\Models\RepairOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class RepairStatusHistoryFactory extends Factory
{
    public function definition(): array
    {
        return ['repair_order_id' => RepairOrder::factory(), 'user_id' => User::factory(), 'to_status' => 'received'];
    }
}
