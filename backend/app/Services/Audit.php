<?php
namespace App\Services;
use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
final class Audit {
    public static function record(string $event, Model $subject, array $metadata = []): void {
        ActivityLog::create(['user_id'=>auth()->id(),'event'=>$event,'subject_type'=>$subject->getTable(),'subject_id'=>$subject->id,'metadata'=>$metadata]);
    }
}
