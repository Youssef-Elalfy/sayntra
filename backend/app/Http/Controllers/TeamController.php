<?php

namespace App\Http\Controllers;

use App\Models\Membership;
use App\Models\Organization;
use App\Models\RepairOrder;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Notifications\StaffInvitation;
use App\Services\Audit;
use App\Services\RepairWorkflow;
use App\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    public function index(): array
    {
        Gate::authorize('permission', 'team.manage');

        return ['data' => Membership::where('organization_id', app(TenantContext::class)->id())->with('user:id,name,email')->get(), 'roles' => array_keys(config('sayntra.roles'))];
    }

    public function technicians(): array
    {
        Gate::authorize('permission', 'repairs.read');

        return ['data' => Membership::where('organization_id', app(TenantContext::class)->id())->where('role', 'technician')->where('active', true)->with('user:id,name')->get()->map(fn ($m) => ['id' => $m->user_id, 'name' => $m->user->name, 'active_repairs' => RepairOrder::where('assigned_technician_id', $m->user_id)->whereNotIn('status', RepairWorkflow::TERMINAL)->count()])];
    }

    public function invite(Request $r): mixed
    {
        Gate::authorize('permission', 'team.manage');
        $data = $r->validate(['email' => 'required|email|max:254', 'role' => ['required', Rule::in(array_keys(config('sayntra.roles')))]]);
        $data['email'] = strtolower($data['email']);
        $token = Str::random(64);
        $invitation = TeamInvitation::create($data + ['token_hash' => hash('sha256', $token), 'expires_at' => now()->addHours(72), 'invited_by' => $r->user()->id]);
        Audit::record('team.invited', $invitation, ['role' => $data['role']]);
        Notification::route('mail', $data['email'])->notify(new StaffInvitation(Organization::findOrFail(app(TenantContext::class)->id())->name, $token));

        return response()->json(['data' => $invitation], 201);
    }

    public function update(Request $r, int $member): array
    {
        Gate::authorize('permission', 'team.manage');
        $data = $r->validate(['role' => ['required', Rule::in(array_keys(config('sayntra.roles')))], 'active' => 'required|boolean']);

        return DB::transaction(function () use ($member, $data) {
            $orgId = app(TenantContext::class)->id();
            Organization::lockForUpdate()->findOrFail($orgId);
            $item = Membership::where('organization_id', $orgId)->findOrFail($member);
            if ($item->role === 'owner' && $item->active && ($data['role'] !== 'owner' || ! $data['active']) && Membership::where('organization_id', $orgId)->where('role', 'owner')->where('active', true)->count() <= 1) {
                throw ValidationException::withMessages(['role' => [__('The organization must retain an active owner.')]]);
            }
            if ((! $data['active'] || $data['role'] !== 'technician') && RepairOrder::where('assigned_technician_id', $item->user_id)->whereNotIn('status', RepairWorkflow::TERMINAL)->exists()) {
                throw ValidationException::withMessages(['member' => [__('Reassign active repairs before changing this technician.')]]);
            }
            $item->update($data);
            Audit::record('team.updated', $item, $data);

            return ['data' => $item->load('user:id,name,email')];
        }, 3);
    }

    public function invitation(string $token): array
    {
        $item = $this->findInvitation($token);

        return ['data' => ['organization' => Organization::findOrFail($item->organization_id)->name, 'email' => $item->email, 'role' => $item->role, 'existing_account' => User::where('email', $item->email)->exists()]];
    }

    private function findInvitation(string $token): TeamInvitation
    {
        abort_unless(preg_match('/^[A-Za-z0-9]{64}$/', $token), 404);

        return TeamInvitation::withoutGlobalScopes()->where('token_hash', hash('sha256', $token))->whereNull('accepted_at')->where('expires_at', '>', now())->firstOrFail();
    }

    public function accept(Request $r, string $token): mixed
    {
        $invitation = $this->findInvitation($token);
        $data = $r->validate(['name' => 'sometimes|required|string|max:120', 'password' => ['sometimes', 'confirmed', Password::min(12)->mixedCase()->numbers()]]);
        $user = app(TenantContext::class)->run($invitation->organization_id, function () use ($r, $data, $invitation) {
            return DB::transaction(function () use ($r, $data, $invitation) {
                $item = TeamInvitation::lockForUpdate()->findOrFail($invitation->id);
                abort_if($item->accepted_at || $item->expires_at->isPast(), 410);
                $user = User::where('email', $item->email)->first();
                if ($user) {
                    abort_unless($r->user() && $r->user()->id === $user->id, 403, __('Sign in with the invited email address.'));
                } else {
                    if (empty($data['name']) || empty($data['password'])) {
                        throw ValidationException::withMessages(['name' => [__('Your name and a strong password are required.')]]);
                    }$user = User::create(['name' => $data['name'], 'email' => $item->email, 'password' => $data['password']]);
                    $user->markEmailAsVerified();
                }
                if (Membership::where('organization_id', $item->organization_id)->where('user_id', $user->id)->exists()) {
                    throw ValidationException::withMessages(['invitation' => [__('This user already belongs to the workspace. Update their membership instead.')]]);
                }
                Membership::create(['organization_id' => $item->organization_id, 'user_id' => $user->id, 'role' => $item->role]);
                $item->accepted_at = now();
                $item->save();
                Audit::record('team.invitation_accepted', $item);

                return $user;
            });
        });
        Auth::guard('web')->login($user);
        $r->session()->regenerate();
        $r->session()->put('organization_id',$invitation->organization_id);

        return ['data' => $user];
    }
}
