<?php
namespace App\Tenancy;
use Closure;
final class TenantContext {
    private ?int $id = null;
    private ?string $role = null;
    public function id(): int { abort_unless($this->id, 403, 'Organization context is required.'); return $this->id; }
    public function role(): ?string { return $this->role; }
    public function set(int $id, string $role = 'owner'): void { $this->id = $id; $this->role = $role; }
    public function clear(): void { $this->id = null; $this->role = null; }
    public function allows(string $permission): bool { return in_array($permission, config('sayntra.roles.'.$this->role, []), true); }
    public function run(int $id, Closure $callback, string $role = 'owner'): mixed { $previous = [$this->id,$this->role]; $this->set($id,$role); try { return $callback(); } finally { [$this->id,$this->role] = $previous; } }
}
