<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

class DeviceFactory extends Factory
{
    public function definition(): array
    {
        return ['customer_id' => Customer::factory(), 'category' => 'computer', 'brand' => 'Lenovo', 'model' => 'ThinkPad', 'serial_number' => fake()->unique()->bothify('SYN-########')];
    }
}
