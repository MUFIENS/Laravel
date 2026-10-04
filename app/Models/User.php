<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property UserRole $role
 * @property string|null $student_identifier
 * @property string|null $avatar_path
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'student_identifier', 'avatar_path'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function isCooperative(): bool
    {
        return $this->role === UserRole::Cooperative;
    }

    public function isStudent(): bool
    {
        return $this->role === UserRole::Student;
    }

    /**
     * Consigned products owned by this student.
     *
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'owner_id');
    }

    /**
     * Product submissions created by this student.
     *
     * @return HasMany<ProductSubmission, $this>
     */
    public function productSubmissions(): HasMany
    {
        return $this->hasMany(ProductSubmission::class, 'student_id');
    }

    /**
     * Active shopping cart for this student.
     *
     * @return HasOne<Cart, $this>
     */
    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    /**
     * Orders placed by this student as a buyer.
     *
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Product submissions reviewed by this cooperative operator.
     *
     * @return HasMany<ProductSubmission, $this>
     */
    public function reviewedSubmissions(): HasMany
    {
        return $this->hasMany(ProductSubmission::class, 'reviewed_by');
    }

    /**
     * Pickups verified by this cooperative operator.
     *
     * @return HasMany<PickupLog, $this>
     */
    public function verifiedPickups(): HasMany
    {
        return $this->hasMany(PickupLog::class, 'verified_by');
    }

    /**
     * Inventory movements logged by this cooperative operator.
     *
     * @return HasMany<InventoryMovement, $this>
     */
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class, 'created_by');
    }
}
