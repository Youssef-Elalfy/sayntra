<?php

namespace Database\Factories;

use App\Models\RepairOrder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DiagnosisFactory extends Factory
{
    public function definition(): array
    {
        return ['repair_order_id' => RepairOrder::factory(), 'user_id' => User::factory(), 'findings' => 'Display cable damaged', 'recommended_work' => 'Replace display cable'];
    }
}
