<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class RepairStatusHistory extends TenantModel
{
    use HasFactory;

    protected $table = 'repair_status_histories';
}
