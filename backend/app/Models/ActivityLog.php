<?php
namespace App\Models;
class ActivityLog extends TenantModel {
    public $timestamps = false;
    protected function casts(): array { return ['metadata'=>'array','created_at'=>'datetime']; }
}
