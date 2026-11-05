<?php
namespace App\Models;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
class User extends Authenticatable implements MustVerifyEmail {
    use HasFactory, Notifiable;
    protected $fillable = ['name','email','password','language','theme'];
    protected $hidden = ['password','remember_token','is_platform_admin'];
    protected function casts(): array { return ['email_verified_at'=>'datetime','password'=>'hashed','is_platform_admin'=>'boolean']; }
    public function memberships() { return $this->hasMany(Membership::class); }
}
