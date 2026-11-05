<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RepairOrder extends TenantModel
{
    use HasFactory;

    protected function casts(): array
    {
        return ['received_at' => 'datetime', 'expected_at' => 'datetime', 'completed_at' => 'datetime', 'delivered_at' => 'datetime'];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_technician_id');
    }

    public function histories(): HasMany
    {
        return $this->hasMany(RepairStatusHistory::class)->orderBy('id');
    }

    public function diagnoses(): HasMany
    {
        return $this->hasMany(Diagnosis::class)->latest();
    }
}
