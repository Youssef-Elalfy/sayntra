<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends TenantModel
{
    use HasFactory;

    protected function casts(): array
    {
        return ['specifications' => 'array'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function repairs(): HasMany
    {
        return $this->hasMany(RepairOrder::class);
    }
}
