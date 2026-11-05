<?php
namespace App\Models;
use App\Tenancy\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
abstract class TenantModel extends Model {
    protected $guarded = ['id','organization_id'];
    protected static function booted(): void {
        static::addGlobalScope('organization', fn(Builder $q) => $q->where($q->getModel()->qualifyColumn('organization_id'), app(TenantContext::class)->id()));
        static::creating(function(Model $model) { $model->organization_id = app(TenantContext::class)->id(); });
        static::updating(function(Model $model) { abort_if($model->isDirty('organization_id'),403,'Organization ownership is immutable.'); });
    }
}
