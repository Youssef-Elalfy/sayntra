<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
class Organization extends Model {
    protected $guarded = ['id','public_id'];
    protected function casts(): array { return ['active'=>'boolean','tax_basis_points'=>'integer','warranty_days'=>'integer']; }
    protected static function booted(): void { static::creating(fn($org) => $org->public_id = (string) Str::uuid()); }
}
