<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Membership extends Model {
    protected $table = 'organization_users';
    protected $guarded = ['id'];
    protected function casts(): array { return ['active'=>'boolean']; }
    public function user() { return $this->belongsTo(User::class); }
    public function organization() { return $this->belongsTo(Organization::class); }
}
